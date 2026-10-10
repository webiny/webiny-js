# A Plan colour binding can contradict the colour the section measured

> **Package:** `@webiny/api-component-extraction` (Plan's token bindings, Generate's prompt)
> **Severity:** low-medium. One observed instance; exposure not measured.
> **Status:** open, 2026-10-10. A note, not scheduled.

## What happens

ParkCity - Take 3's Apartment Intro Hero has a "Pre-Application LINK" that is **white** on the site. Capture
recorded it as `rgb(255, 255, 255)`, and the section's measured colours give text `#ffffff` →
`text.inverse`. The prompt also carries Plan's own binding for the field:

```
- ctaLink: var(--wby-color-action-primary-background)
```

The model followed the binding, and the link renders terracotta `#a65f46`. Plan bound the CTA by what CTAs
usually are (an accent), not by what this one measured.

## Why nothing caught it

- **The crossing check allows it.** `bindingCrossesFamily` reads the target `ctaLink` as a text role, and
  text in an accent colour (`action.*`) is an allowed pairing, so the binding passes.
- **Nothing compares a binding with the measurement.** No check compares a Plan binding's token value with
  the colour the section measured for that element.

## Not the overlay gap

[`capture-records-no-pseudo-elements-or-opacity.md`](./capture-records-no-pseudo-elements-or-opacity.md) is
about colours Capture never sees. This colour was seen and recorded correctly; a Plan binding overrode it.

## Before fixing

Measure first: across stored plans, count bindings whose token value differs from the measured colour of
the element they target, by more than the fit's tolerance of 6.
