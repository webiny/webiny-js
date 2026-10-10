# Capture records no pseudo-elements and no opacity, so colour overlays are never measured

> **Package:** `@webiny/api-component-extraction` (Capture's element tree)
> **Severity:** medium. A hero with a colour wash over its photo migrates as the bare photo.
> **Status:** open, 2026-10-10. A capture-shape change; it gets its own measured pass. Not scheduled.

## What happens

Park City Place's "Comfort Is Coming Home to Park City Place" hero is a photo under a 90% slate wash. The
site draws the wash on a pseudo-element:

```css
.row-37554295::before {
  background-color: #363f54;
  opacity: 0.9;
}
```

Capture's tree records elements only. It has no `::before` or `::after`, and no `opacity` in its styles.
So in that hero's box it holds the section `div` (the photo as its CSS background image, over a terracotta
`#a65f46` the photo hides) and the button. The section's measured colours are the white text and the
button: neither the wash nor the photo's colour. Generate had nothing to say the wash exists and rendered
the bare photo, so white text sits on a bright image.

The same `::before` overlays are on other rows of that page, at opacity 0.9 and 0.05.

## The reverse of the case already handled

The translucency work handled **a translucent image over a colour** (`colourUnderImage`): the colour
behind a photo was being reported as the section's background. This is **a translucent colour over an
image**, drawn on a layer Capture never sees. The fix is not in the colour logic. Capture has to record
pseudo-elements that paint (`content` set, a background or a border) and the opacity of what it records.
Only then can a later stage composite the wash over the photo.

## Before fixing

- **Measure it first.** Measure how many captured sections have a painting `::before`/`::after`, across
  the stored captures (the DOM is stored, so this is offline). Then measure how many of those cover the
  section.
- **Capture's tree shape is read by every later stage.** Adding nodes changes Segment's boundaries and
  Cluster's fingerprints, so it needs its own replay.

Found in `reports/2026-10-10/parkcity-take3-background-colours.md`, section 3.
