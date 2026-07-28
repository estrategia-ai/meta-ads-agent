#!/usr/bin/env python3
"""
analyze_test_candidates.py — A partir del gasto por producto de una cuenta de Meta Ads,
genera hipotesis de prueba: que productos agrupar y testear como conjuntos de productos.

Entrada: products.json con el gasto por producto, que el modelo prepara a partir de
ads_get_ad_entities (breakdown product_id). El script solo cuenta, rankea y formatea —
el calculo va en script para que las sugerencias sean deterministas, no hechas a ojo.

Uso:
  python3 analyze_test_candidates.py --products products.json [--currency COP] [--window last_30d]
"""

import argparse
import json
from collections import defaultdict


def fmt(n):
    """Formatea un numero con separador de miles; sin decimales si es entero."""
    n = round(float(n), 2)
    return "{:,}".format(int(n)) if n == int(n) else "{:,.2f}".format(n)


def pct(part, whole):
    return 0.0 if whole == 0 else part / whole * 100.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--products", required=True)
    ap.add_argument("--currency", default="")
    ap.add_argument("--window", default="last_30d")
    ap.add_argument("--concentration-pct", type=float, default=55.0,
                    help="El top 5 por encima de este %% del gasto marca inversion "
                         "concentrada. Default 55.")
    ap.add_argument("--tail-pct", type=float, default=15.0,
                    help="La cola subfinanciada acumula productos desde el menor gasto "
                         "hasta este %% del gasto total. Default 15.")
    ap.add_argument("--unknown-floor", type=float, default=3.0,
                    help="Piso de ruido: la Hipotesis 4 solo aparece si el gasto sin "
                         "atribuir es >= este %% del total. Default 3.")
    args = ap.parse_args()

    with open(args.products, "r", encoding="utf-8") as f:
        data = json.load(f)

    cur = args.currency or data.get("currency", "")
    window = data.get("window", args.window)
    raw = data.get("products", [])

    # Separar el bucket "unknown" (gasto no atribuido a un producto) del resto.
    unknown_spend = 0.0
    prods = []
    for p in raw:
        pid = str(p.get("product_id", ""))
        spend = float(p.get("spend", 0) or 0)
        if pid.lower() == "unknown":
            unknown_spend += spend
        elif spend > 0:
            prods.append({"product_id": pid,
                          "name": (p.get("name") or "(sin nombre)").strip(),
                          "spend": spend})
    prods.sort(key=lambda p: -p["spend"])

    out = ["# 🧪 Sugeridor de productos para testear", ""]

    n = len(prods)
    if n == 0:
        out.append("No hay productos con gasto en la ventana consultada — sin datos para "
                   "generar hipotesis. Revisa que la cuenta tenga campanas de catalogo "
                   "activas.")
        print("\n".join(out))
        return

    total = sum(p["spend"] for p in prods)
    mean = total / n
    out.append("Ventana: **{}** · Moneda: **{}** · **{}** productos con gasto · "
               "inversion total **{}**".format(window, cur or "?", n, fmt(total)))
    out.append("")

    # --- Concentracion ---
    top5 = sum(p["spend"] for p in prods[:5])
    top10 = sum(p["spend"] for p in prods[:10])
    out.append("## Concentracion de la inversion")
    out.append("")
    out.append("- Top 5 productos: **{:.0f}%** del gasto".format(pct(top5, total)))
    out.append("- Top 10 productos: **{:.0f}%** del gasto".format(pct(top10, total)))
    out.append("- Gasto promedio por producto: **{}**".format(fmt(mean)))
    concentrated = pct(top5, total) >= args.concentration_pct
    if concentrated:
        out.append("")
        out.append("> Inversion **concentrada**: pocos productos absorben la mayoria del "
                   "presupuesto. El algoritmo esta apostando estrecho — es muy probable "
                   "que haya productos sin una oportunidad real. Justo eso es lo que vale "
                   "la pena testear.")
    out.append("")

    # --- Hipotesis 1: cola subfinanciada ---
    asc = sorted(prods, key=lambda p: p["spend"])
    tail, acc = [], 0.0
    tail_cap = total * (args.tail_pct / 100.0)
    for p in asc:
        if acc + p["spend"] > tail_cap and len(tail) >= 3:
            break
        tail.append(p)
        acc += p["spend"]
    out.append("## Hipotesis 1 — Conjunto de cola subfinanciada")
    out.append("")
    out.append("**{}** productos que entre todos suman apenas **{}** ({:.0f}% del gasto). "
               "Individualmente el algoritmo casi no los corrio — no necesariamente "
               "porque sean malos, sino porque nunca los dejo competir.".format(
                   len(tail), fmt(acc), pct(acc, total)))
    out.append("")
    out.append("**Que testear:** agrupa estos en un conjunto de productos propio y dale "
               "presupuesto dedicado. Si alguno despega con oportunidad real, encontraste "
               "un ganador que estaba escondido bajo la concentracion.")
    out.append("")
    out.append("| Producto | product_id | Gasto |")
    out.append("|---|---|--:|")
    for p in tail:
        out.append("| {} | {} | {} |".format(p["name"], p["product_id"], fmt(p["spend"])))
    out.append("")

    # --- Hipotesis 2: por tipo de producto ---
    by_type = defaultdict(lambda: {"spend": 0.0, "count": 0})
    for p in prods:
        words = p["name"].split()
        t = words[0] if words else "(sin tipo)"
        by_type[t]["spend"] += p["spend"]
        by_type[t]["count"] += 1
    types = sorted(by_type.items(), key=lambda kv: -kv[1]["spend"])
    out.append("## Hipotesis 2 — Conjunto por tipo de producto")
    out.append("")
    out.append("| Tipo | Productos | Gasto | % del gasto |")
    out.append("|---|--:|--:|--:|")
    for t, v in types:
        out.append("| {} | {} | {} | {:.0f}% |".format(
            t, v["count"], fmt(v["spend"]), pct(v["spend"], total)))
    out.append("")
    multi = [tv for tv in types if tv[1]["count"] >= 2]
    if multi:
        low_t, low_v = multi[-1]
        out.append("**Que testear:** el tipo **{}** ({} productos) recibe apenas "
                   "**{:.0f}%** del gasto. Arma un conjunto solo de ese tipo y mide su "
                   "rendimiento aislado — hoy compite en desventaja contra los tipos "
                   "dominantes y no sabes si es malo o solo esta opacado.".format(
                       low_t, low_v["count"], pct(low_v["spend"], total)))
        out.append("")

    # --- Hipotesis 3: variantes del mismo producto ---
    by_name = defaultdict(list)
    for p in prods:
        by_name[p["name"]].append(p)
    clusters = sorted(
        [(nm, ps) for nm, ps in by_name.items() if len(ps) >= 2],
        key=lambda x: -sum(q["spend"] for q in x[1]))
    if clusters:
        out.append("## Hipotesis 3 — Variantes del mismo producto")
        out.append("")
        out.append("Hay productos que aparecen como varias entradas distintas (tallas o "
                   "colores con FBID propio). El gasto se reparte entre las variantes y "
                   "eso esconde la fuerza real del producto:")
        out.append("")
        out.append("| Producto | Variantes | Gasto combinado |")
        out.append("|---|--:|--:|")
        for nm, ps in clusters[:8]:
            out.append("| {} | {} | {} |".format(
                nm, len(ps), fmt(sum(q["spend"] for q in ps))))
        out.append("")
        out.append("**Que testear:** evalua estos a nivel de **producto padre**, no de "
                   "variante suelta. Al armar un conjunto, incluye todas las variantes "
                   "juntas para medir el producto completo.")
        out.append("")

    # --- Hipotesis 4: gasto sin atribuir (solo si supera el piso de ruido) ---
    gtotal = total + unknown_spend
    unknown_share = pct(unknown_spend, gtotal)
    if unknown_share >= args.unknown_floor:
        out.append("## Hipotesis 4 — Gasto sin producto identificado")
        out.append("")
        out.append("**{}** ({:.0f}% del gasto total) no quedo atribuido a ningun "
                   "producto. Antes de testear nada, entiende que es: productos sacados "
                   "del catalogo, desajuste de IDs, o anuncios de catalogo amplios. Es "
                   "ruido que ensucia toda lectura por producto.".format(
                       fmt(unknown_spend), unknown_share))
        out.append("")

    out.append("---")
    out.append("")
    out.append("_Esto es **gasto, no ventas** — muestra donde el algoritmo pone el dinero, "
               "no que convierte. Y solo ve productos que recibieron gasto: el inventario "
               "nunca anunciado no aparece. Son **hipotesis para testear**, no ganadores "
               "garantizados — el test es lo que lo confirma._")
    out.append("")
    out.append("_Umbrales usados: concentracion top-5 >= {:.0f}% · cola subfinanciada "
               "hasta {:.0f}% del gasto · piso de ruido del gasto sin atribuir "
               ">= {:.0f}%. Ajustables con --concentration-pct, --tail-pct y "
               "--unknown-floor._".format(
                   args.concentration_pct, args.tail_pct, args.unknown_floor))

    print("\n".join(out))


if __name__ == "__main__":
    main()
