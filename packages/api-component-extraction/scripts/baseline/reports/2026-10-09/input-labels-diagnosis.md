# Input labels: diagnosis and proposal

Diagnosis only; no code changed. Issue: `ai-context/issues/capture-reads-no-input-labels.md`.

## Where the label is lost

`captureEvaluator.ts` records each element's tag, box, styles, direct text, href, src, alt and icon. An
`<input>` has no text node; its visible label is its `value`, which is not read. So the tree has a
78x44 input with the brand fill and nothing in it. The label is not lost from the capture altogether:
each page's full HTML is stored (`capture/page-N/dom.html.gz`), and there it is,
`<input type="submit" value="Send">`.

## How far it reaches (read in the outputs, against each site's own label)

Labelled submit and button inputs appear on 7 of the 8 stored runs: every G5 site ("Send" on its
forms, one "Get Directions"). thevibe submits with a hidden `<button>`; its two forms are left out.

| Run      | Form                       | Submit, as generated and stored                        | Against "Send"    |
| -------- | -------------------------- | ------------------------------------------------------ | ----------------- |
| 6ac4f6bd | Contact Form               | a "Submit" link                                        | label invented    |
| 6ac50186 | Contact Form with Map View | "Please Call (346) 489-6939", bound as the submit      | wrong text bound  |
| 6ac5f4a5 | Contact Form               | "Please Call 346-489-6939"                             | wrong text bound  |
| 6ac62af1 | Contact Form               | "Please Call 346-489-6939"                             | wrong text bound  |
| 6ac5f9a1 | Contact Form (7 props)     | a "Submit" button                                      | label invented    |
| 6ac5f9a1 | Contact Form (11 props)    | no submit control                                      | missing           |
| 6ac5f9a1 | Schedule Tour Form         | "Send"                                                 | right             |

**1 of 7 right.** Three ways wrong, one cause: with no label in the tree, Plan's binder either leaves
`submitButton` empty (then Generate invents "Submit", or, with "Show no other text", drops the button)
or binds the nearest link text to it (a phone call-to-action). "Submit" is one word, so the
invented-text validator cannot see it. These are stored components on the runs the demo uses.

## Proposal

1. **Capture:** read an input's label. For `<input type="submit|button|reset">`, record its `value` as
   the node's text: it is the text the control shows. `<button>` already has text. (Placeholders and
   `<option>` text are left for later: they are form chrome the validator already exempts.)
2. **Stored runs (the demo, no re-capture before the 16th):** the label is in each stored page's HTML.
   Options, to decide:
   - a. **Patch the stored trees** from the stored HTML (inputs in document order, matched by type and
     position among the tree's inputs), then re-run Plan and Generate on the form components only.
     Plan re-runs re-propose props (`plan-rerun-is-not-variance-free`), so the re-run is held to forms.
   - b. **Re-capture the demo runs** with the fix. Re-runs everything downstream, and re-clustering the
     demo runs is held until after the 16th.
   - c. **Leave the demo runs** and fix forward: the forms stay wrong for the demo.
3. **Not decided here:** whether Plan treats a submit control as a Link prop or as fixed form chrome.

## Predictions, for the fix on the check run (re-captured; it is not a demo run)

1. Each G5 form's tree carries "Send" on its submit input; Plan binds `submitButton` to "Send" on the
   three check-run forms, and not to a phone call-to-action.
2. Generated forms render "Send" as their submit on 3 of 3, including the tour form with "Show no
   other text" in the prompt (the interaction removed).
3. No other component's text changes: the fix adds text only to labelled inputs.
