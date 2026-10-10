# Inline-link fold: replay result

The fold that puts a link inside running text back into its paragraph's rich text, with its `<a href>`
(`ai-context/issues/inline-links-are-lifted-into-standalone-link-props.md`). Replayed offline over all 33
stored plans before anything was re-bound: the real `rebindComponent` (old), against it followed by the
fold (new), on each component's member sections, the 9 plans that predate `observedStructured` included.

## What the replay caught before anything shipped

1. **It would have removed a form's submit button.** 2424 Tulane's "Tour Scheduling Form" `submitButton`
   held only "privacy policy", another slot's value. The fold emptied the prop and removed it, so the
   form would have lost its submit from the contract. It would have been a visible regression, on a
   component class that already lost its button once this week. Submit props are now never given up or
   removed.
2. **It put one paragraph into two samples.** Property Description's two stored paragraph values both
   shared words with the captured paragraph node, which holds two paragraphs, and both were replaced with
   the same rebuilt HTML. That is duplicated content inside a fix for duplication. The fold now changes
   one value per link: one that already holds the link's text first, else the first that holds the
   paragraph.

## Result, after both fixes

- **Scale:** 47 components in 18 runs change; 24 Link props are removed, each of which held only
  inline-link labels.
- **Kinds of change:** every change is a Link value leaving its prop, or a rich text value gaining exactly
  one `<a href>`. Nothing else in any plan moves; no changed value is duplicated.
- **Against the predicted fold set:**
  - **Folded, not predicted (3):** 2424 Tulane (24 Sep) "privacy policy" → `consentText`; Park City
    Palace "Community amenities" → `body`/`description`; Park City Palace "your new home" → `heading`
    (rich text in that older plan). Each fits the rule. The prediction matched paragraphs without the
    link's own words, so the rule caught more than the prediction. Accepted.
  - **Predicted, not folded (1):** The Vibe's "Read More". Its stored value lacks the phrase and its
    paragraph's runs do not line up with its children, so the fold declines rather than guess. It stays a
    Link, unchanged. Accepted as the better outcome.
- **ParkCity - Take 3:**
  - "our ideal location" and "in-home features" go into `body`;
  - "privacy policy" goes into `privacyText`, and `mapLink`, which held it in the wrong place, is removed;
  - "ultimate neighborhood" goes into `body`, and the sentence gets its first word back ("Experience");
  - "Community amenities" goes into `description`, and `cta` is removed.

## Measurement record: rich text rendered as HTML is 157 of 206, not 175

Composition hands HTML only to a rich text input the component renders as HTML. Across the 206 rich text
props in the 33 stored runs' components:

- **157** render the value as HTML only;
- **49** print it as text, treat it as an array, or rebuild a link from a placeholder.

**The first count said 175.** Its pattern used a word boundary, which matched inside class names such as
`property-description-label`, and so misread components in both directions. The corrected figure comes
from `lexicalHtmlInputs`, the function that guards composition, not from a proxy for it. The 157 were
also searched for any text operation on the value (`.split`, `.map`, concatenation outside `__html`):
none.

## After the re-bind and regeneration (ParkCity - Take 3, deployed)

- **The re-bind matched the replay.** Each of the four components changed exactly as replayed; `mapLink`
  (Contact Us Form) and `cta` (Property Description, Neighborhood Perks Section) were removed.
- **Regeneration exposed a validator bug the fold triggers.** The text check's "is it in the renderable
  source" path stripped `//…` to the end of the line as a comment, including the `//` in `https://`
  inside a string. The fold puts a link's URL in the middle of a paragraph's default text, so everything
  after the link was discarded, and Neighborhood/Location Highlight failed twice on "in Bridgeport. When
  you call…", text that was there. The morning's version never failed on it. `//` after a colon is no
  longer treated as a comment. Tested on the real case; the test fails without the fix.
- **Results:**
  - **Neighborhood/Location Highlight** now passes every check, first attempt. In its render, "our ideal
    location" appears **once**, inside the paragraph, as a link. The heading "Explore our ideal location
    in Bridgeport." is the site's own.
  - **Contact Us Form:** "By submitting this form, you agree to the privacy policy." with the link in the
    sentence; passes.
  - **Neighborhood Perks Section:** "Experience ultimate neighborhood convenience…" with the link inline;
    passes.
  - **Property Description:** still fails text preservation, now 3 paragraphs where it was 2 after the
    colour regeneration. The structural cause (one rich text field observed as four alternative
    paragraphs, rendered with the first) is the filed wrong-slot class. The fold adds the amenities
    sentence to it, because that sentence is no longer hardcoded beside the removed `cta`. Its default
    render shows every paragraph, with "Community amenities" inline.
- **No markup in any of the four renders**, and every rich text input of the four renders as HTML.

### Not yet seen: composition (c) deployed

Composition's half has not run against anything deployed. It runs at Assemble and site build, and Take 3
has not been assembled or promoted. For the 49 plain-text rich text inputs, (c) leaves the value unchanged
by construction (unit-tested), so their pages render as they did before. **That is a claim from the code,
not a render.** Take 3 holds 2 of the 49 (Contact Form `consentText`, Accessibility Statement
`paragraphs`). The 71 Westland fallback holds 2 and stays untouched.
