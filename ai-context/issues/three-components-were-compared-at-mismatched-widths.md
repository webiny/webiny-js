# Three components were compared at mismatched widths

> **Package:** `@webiny/api-component-extraction` (`ComponentRenderService`, `SegmentHandler`)
> **Severity:** low — an **evidence caveat** on
> `plans/component-extraction-visual-fidelity-report.md`, affecting 3 of its 34 components. Recorded
> so nobody reads those three rows as strongly as the other 31.
> **Status:** open. The view now states the mismatch on the card
> (`GenerateView` → `SizeBlock`), so a reviewer is told rather than left to assume parity.

## What happens

Renders are taken at `DESKTOP_WIDTH = 1440`, matching the desktop capture width. Section crops are
the **element's box**, so a contained section — one narrower than the viewport — produces a narrower
crop. Cluster already computes this distinction and calls it `geometryClass`:

```ts
const width = node.box.width >= 0.9 * viewportWidth ? "full" : "contained";
```

Where the crop is contained, the render and the crop are two different layout widths, and a
difference in line breaking, column count or type scale between them may be the width rather than
the component.

## Which ones

31 of 34 crops are 1440px. Three are not, all on 2424 Tulane:

| component              | crop width | render width |
| ---------------------- | ---------- | ------------ |
| Site Header Navigation | 1300       | 1440         |
| Hero Banner            | 1320       | 1440         |
| Floor Plan Filter      | 1320       | 1440         |

The other three sites are 1440 throughout — Park city Palace 7/7, 71 Westland 8/8, Freehill 6/6.

## What it does and does not affect

It does **not** affect the report's distribution finding. All three sit in the in-band or too-short
groups, and the nine too-tall components — the whole of the union-text evidence — are 1440px crops.

It does mean the height ratios for those three rows (notably Site Header Navigation at 255 → 68px)
carry an unquantified width component, and should not be quoted as precise.

## What would close it

Either render a contained component at its section's measured width, or crop contained sections to
the full viewport width so both sides are 1440. The first compares like with like; the second keeps
one render width for every component. The choice depends on whether a component is considered to own
its gutters, which is the same question `nothing-tells-the-model-how-big-anything-is` raises about
full-bleed versus contained.
