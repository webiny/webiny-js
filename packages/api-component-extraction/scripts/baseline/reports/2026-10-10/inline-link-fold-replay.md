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
- **A latent bug, set off by the fold, failing in the direction that calls a correct component
  broken.** The bug had no trigger until the fold put a URL in the middle of a paragraph. It is the second
  this week where a change created the conditions for an existing defect rather than introducing one.
  Details: The text check's "is it in the renderable
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

## Take 3 built into its own tenant: composition (c) seen deployed

Assemble (8 pages, 46 instances), Promote (15 promoted; Property Description declined, "3 text fragment(s)
not reproduced", the gate working), Build site into the new tenant `parkcitytake380cd` (theme, 15
components, 40 images, 8 pages). The run's Generate stage was stale from the re-bind; it was marked current
with the recorded reason after verifying that the 12 components not re-bound were byte-identical to the
plan before it, and the 4 re-bound were regenerated after it.

### As predicted

- **Inline links are in their paragraphs, pointing at migrated pages:** "our ideal location" →
  `/apartments/ct/bridgeport/neighborhood` (home), "in-home features" → `/amenities` (floor plans),
  "ultimate neighborhood" → `/neighborhood` (amenities). The external privacy policy stays absolute.
- **Accessibility Statement `paragraphs`** (one of Take 3's two plain-text cases): no link added, no
  markup.

### Not predicted: four defects, three of them made by this fix

1. **Visible markup on the amenities page.** Contact Us Form shows "By submitting this form, you agree to
   the `<a href="https://cthousingpartners.org/privacy-policy/">privacy policy</a>`." The regenerated
   component declares `privacyText` as a plain **text** input. Composition's scalar derivation fell back
   to Plan's stored sample, which the fold (b) had made HTML, and wrote it into that text input. The guard
   in (c) covers rich text inputs only, so this route bypassed it. It is the one text input carrying HTML
   across the site's 8 pages. **Made by the fix.**
2. **The link twice on the home page's Contact Form** ("…agree to the privacy policy. privacy policy.").
   `consentText` is one of Take 3's two plain-text cases, but its source renders it as HTML in one branch,
   so (c) took it. The component was not re-bound, so it still has its own privacy link and appends it.
   (c) rebuilt the split sentence with the link as well. **Made by the fix:** the split-sentence rebuild
   must not run where the component still carries the link as its own input.
3. **"our ideal location" linked in the heading too** ("Explore our ideal location in Bridgeport.", no
   link on the source). (c) wraps a link's words in any rich text value that contains them; it must only
   wrap the value that holds the link's paragraph, as Plan's fold does. **Made by the fix.**
4. **The neighborhood page's Location Highlight body is only "your new home".** The sentence around it is
   lost, because derivation filled `body` with the link's words alone, the same shape as the 71 Westland
   intro. (c) then made those words a link. The lost sentence is the existing wrong-slot defect, not this
   fix.

## Corrections to the first build's report

- **No inline link sat inside its paragraph on any built page.** On every Location Highlight and Perks
  instance, `body` held only the link's own words, as a link (a wrong-slot value). On the home page the
  paragraph had gone into `heading`. The first report said the links were "in their paragraphs, pointing
  at migrated pages". It checked that each link existed and where it pointed, not what surrounded it.
- **Take 3 holds 1 of the 49 plain-text inputs, not 2.** Contact Form `consentText` renders as HTML. The
  "2" came from matching component and prop names across runs: another run's Contact Form `consentText`
  is plain text.
- **Test counts.** "All 505/507 tests across both packages" covered only `api-component-extraction`.
  The combined command does not run `api-page-composition-poc`'s tests; run alone, they pass (130).

## Rebuilt after the three fixes (and a fourth the rebuild showed)

The fixes: link tags are stripped before any input that does not render HTML; a sentence the component
assembles itself is not rebuilt; a link's words are wrapped only in the value holding its paragraph (Plan's
rule). The rebuild then showed a fourth:

- **"…agree to the privacy policy. privacy policy." on the amenities page.** The strip kept the link's
  words, and the component appends its own link. A link the component carries itself now goes with its
  words.

The served pages were read again 90 seconds after the rebuild. A read straight after it returned the
previous build's content once, so a page is not read straight after a build.

| Check                                        | Result                                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visible markup, all 8 pages                  | **None.**                                                                                                                                                                                                                                                                                         |
| Amenities consent                            | "By submitting this form, you agree to the." then the component's own link: once.                                                                                                                                                                                                                 |
| Home Contact Form consent                    | The component's own link once. The stray " ." before it is in the derived text, and is present on the 71 Westland site built yesterday: not from this work.                                                                                                                                       |
| Home heading                                 | No link. It reads "Explore", a wrong-slot value.                                                                                                                                                                                                                                                  |
| Defect 4 (neighborhood body "your new home") | **Still broken and still reported:** plain text, no link; the page map reports "Navigate your daily routine with ease wh…" missing. The home page's "Whether you're an adventurer…" is likewise reported missing.                                                                                 |
| Contact-us page                              | "privacy policy" twice: `privacyText` holds the link's words alone and the component appends its own link. Present in the first build too; my first check's pattern missed it. Wrong-slot shape; whether it predates the fold is not established, because Take 3 was never composed before today. |

### What this means for the fix

On Take 3's built pages, composition's half adds no link at all. Every paragraph that holds an inline link
reaches the page in the wrong slot, or not at all, so there is no paragraph value to put the link in.
The destinations that were visible in the first build were links standing alone, in wrong-slot values;
fix 3 correctly stopped linking those. The inline-link fix produces linked paragraphs only where
composition places the paragraph in its rich text input, and on this site the wrong-slot defect prevents
that.

### The 49 plain-text inputs beyond Take 3, as far as can be checked without composing other runs

- **Plan's HTML samples reach only Take 3.** Across the 33 stored plans, observed values holding `<a` exist
  only in Take 3's re-bound plan (5 values), and the strip now removes them before any plain-text input.
- **Composition's classification holds on the sources it reads.** Across the 323 promoted Library
  components there are 182 rich text inputs: 130 render as HTML, 52 do not, and none of the 130 also
  performs a text operation on the value.
- **Not checked:** a page composed from any other run after today's change. That needs composing those
  runs.
