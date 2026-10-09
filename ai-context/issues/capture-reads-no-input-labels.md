# Capture reads no input labels, so the prompt is confident about a button it knows nothing of

> **Package:** `@webiny/site-capture` (the captured tree), then `@webiny/api-component-extraction`
> (Plan's binding, Generate's prompt)
> **Severity:** medium. On the re-clustered check run, both forms' submit buttons; on the tour form, a
> generated form with no submit control in 4 of 4 runs.
> **Status:** open. Found 2026-10-09 (`packages/api-component-extraction/scripts/baseline/reports/
2026-10-08/prohibitions-result.md`, correction).

## The shape

The same shape as every defect since the prompt diagnosis: **the model follows faithfully, and the
prompt is confident about data it does not have.** The prompt hands Generate a `submitButton` prop with
no value, lists the section's text without the button's label, and tells it to "show no other text".
Nothing in it says the label exists and was not read.

## What happens

The capture records an element's tag, box and styles. For an `<input>` it does not record `type` or
`value`, and a submit control's label is its `value`. Both forms on 2424 Tulane submit with
`<input type="submit">` (78x44, the brand fill) labelled **SEND** in the screenshots. So:

- Plan binds a `submitButton` (Link) with no label and no destination: a valueless prop, one of the 8
  "the section has it, Plan captured nothing" props in `prohibitions-design.md`.
- Generate, told to show no text the prompt does not list, writes code that renders the button only
  when the prop has a label, and leaves the label empty. **Schedule Tour Form ships with no submit
  button in 4 of 4 runs** with that line in the prompt.
- Where the model reads the crop instead of the prompt, it gets it right: Contact Form defaults its
  label to "Send" in every arm, and without the line the tour form does too. That is the model working
  around the prompt, not the prompt working.

The same gap covers any label held in an attribute rather than text: input placeholders (the validator
already exempts form text for this reason), `<option>` text, and text inside iframes such as the
reCAPTCHA widget.

## What would fix it

Capture an input's `type`, `value` and `placeholder`, and an `<option>`'s text, so Plan can bind a
submit control's label like any other text and the prompt lists it. Then the "show no other text" line
has nothing real to suppress. Fixed in the data, not by rewording a prohibition.

## Not decided here

Whether Plan should treat `<input type="submit">` as a button prop or as fixed form chrome.
