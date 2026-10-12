# The Site step as the result: scoping

A report only. Nothing is built, deployed or generated. The Webiny MCP server and skills were used:
the admin UI catalog, for what the design system already has.

The figures come from three sites, read 2026-10-12: the site-tenant rehearsal (3 pages, published
today), 71 Westland (10 pages, published 2026-10-09) and Take 3 (8 pages, published 2026-10-12 08:28).

## 1. What each per-page line resolves to

| Line           | How it is derived                                                                   | Rehearsal      | 71 Westland                     | Take 3                         |
| -------------- | ----------------------------------------------------------------------------------- | -------------- | ------------------------------- | ------------------------------ |
| SEO            | the published page's own `seo.title` and `seo.description`                          | 3 of 3 carried | **0 of 10**                     | **0 of 8**                     |
| Images         | the image files in the page's component inputs, matched to the site's File Manager  | 0–3 per page   | 4–11 per page, WebP and one SVG | 2–9 per page, WebP and one SVG |
| Accessibility  | the page's components, each matched to its generated record's `qualityInstructions` | 0 of 1–13      | 0 of 4–7                        | 0 of 4–8                       |
| Responsiveness | the same, for the seventh instruction                                               | 0 everywhere   | 0 everywhere                    | 0 everywhere                   |

### SEO

- **It is the only line that is per page by nature,** and it is what it says.
- **It reads "not carried over" on all 18 pages of the two property sites,** because they were published
  before the copy existed. Their sources declare a description on every page (18 of 18, measured
  earlier), so the next publish carries them.
- **The wording has to say why,** or 0 of 10 reads as a failure. Proposed:
  - "Title and description carried over"
  - "Not carried over: published before this was added. Publishing again carries them."

### Images

- **Every page's image URLs matched a file in its site's File Manager:** 0 unmatched across 21 pages.
- A typical page: 71 Westland's home page has 11 images, 10 WebP and 1 SVG.
- **What the count does not see:**
  - pictures a component's CSS sets as a background, or that its code holds outside an input;
  - pictures shared across pages: the logo is counted on every page.
- So the line is "images in this page's components", not "images on this page". Proposed: "11 images ·
  10 WebP, 1 SVG".

### Accessibility and responsiveness

- **Both read 0 on every page today:** no generated record in any of the three runs carries a quality
  instruction (0 of 18, 0 of 16, 0 of 15). That is correct while the instructions are off.
- **"Components on this page" will mean distinct components,** since the pass belongs to a component,
  not to a placement. Only one page differs: the rehearsal home page has 16 placements of 13
  components.
- **Matching a page's components to their generated records must go by Library id and signature, not
  by name.** Site copies carry a site prefix and keep-both suffixes ("… (2)"). Matching by name was
  enough for today's all-zero figures, but it is not correct.
- **Proposed wording:**
  - "Accessibility pass applied to 5 of 6 components on this page"
  - at zero, "Accessibility pass: not applied. This page's components were generated before it
    existed."
  - responsiveness the same way.

### Two conflicts with earlier decisions, for you to settle

1. **Showing the line at zero.**
   - Your brief says a page's line shows "0 of 6" rather than hiding.
   - The site-level lines built last round appear only when the count is above zero, as approved then
     ("the label appears only where it ran").
   - Showing zero claims nothing ran, so it is honest. The proposal is the zero wording above at both
     levels, so the page list and the site summary agree.
2. **Mobile on the Site step.**
   - It was agreed to stay off until the narrow capture work lands, because a beta line where nothing
     new ran is what we agreed not to do.
   - With the seventh instruction, something new does run, so a line can be honest. **But only if it
     names the generic pass.**
   - The approved Mobile wording ("generated from its desktop and 390px captures") would be false and is
     not used. Proposed instead: "Responsiveness pass applied in generation: fluid widths, no sideways
     scrolling, stacking at narrow widths, tap targets."

## 2. The seventh instruction: responsiveness (`quality.responsive`), for approval

> Make the component work at any width from 320px up without knowing the page around it: size its
> containers with fluid widths (%, fr, minmax, max-width) rather than fixed pixel widths; keep everything
> inside its container, so the page never scrolls sideways at 320px; below 768px, stack side-by-side
> columns and rows of cards in reading order; make links and buttons at least 44×44px to tap; let text
> wrap inside its box, breaking long words and URLs (`overflow-wrap: anywhere`) rather than spilling out.
> At wide widths, keep the layout the crop shows.

- **It is the weakest of the seven,** and that is recorded wherever it is listed: **no source data
  stands behind it.** The others carry what the capture recorded (alt text, heading levels, form
  fields, drawn sizes). This one asks for a behaviour, like the focus outline, and the model invents
  the mobile layout, exactly as it does today.
- **What it adds** over the shared prompt's existing "Include responsive styles using `@media` queries
  for smaller screens": the 320px floor, the overflow rule, tap targets and text wrapping.
- **What would make it stronger** is filed: `ai-context/issues/mobile-layout-has-no-capture-behind-it.md`
  (a narrow tree, section matching, a second reference image, and a re-capture per site).

## 3. What the sitemap should contain

The two options as framed are both wrong, and a third is available.

- **The App Runner URL with `?wb.tenant=`** (what it holds today) is where the page renders, but it is
  not a live URL in any useful sense:
  - a crawler cannot reach the site that way;
  - all sites share the host;
  - it stops being right the moment the site gets a domain.
- **A placeholder domain** is a list of URLs that do not exist.
- **The source site's own domain** is not a placeholder. It is the domain the migrated site replaces.
  - **Every migrated path is identical to its source page's path: 21 of 21** (rehearsal 3, 71 Westland
    10, Take 3 8).
  - So "source domain + migrated path" is exactly the old site's URL for the same page. When the
    customer points the domain at the new site, the sitemap is the live sitemap, and every URL a
    search engine already knows keeps working without a redirect.

**Recommendation:** the source site's domain and the migrated paths, said on the Site step: "Sitemap
for www.71westlandapts.com: 10 pages, live once the domain points at this site".

- **Until then**, those URLs serve the old site's version of the same pages, which is correct for a
  sitemap of that domain.
- **If a customer moves to a different domain,** this is wrong. The per-site base URL filed with the
  sitemap-serving issue is where that would be set.
- **"View site" stays** the App Runner URL with the tenant, because that is where the site can be seen
  today. It is labelled as the preview address, not the live one.

## 4. The presentation, briefly

What it reuses from the design system:

- **`Widget`** (title, icon, description, header actions) for the site-wide block;
- **`BetaBadge`**, the design system's own beta mark (small, primary-tinted). It goes on the
  accessibility and responsiveness column headers, not repeated on every row;
- **`Tag`** for the per-page values;
- **`Tooltip`** for the caveats (what the image count does not see; that responsiveness is generic);
- **the existing `Button`** for "View sitemap" and "View site".

```
┌ Site result ─────────────────────────────────────── [View site] ┐
│  Sitemap            Images                     Pages             │
│  10 pages           48 · 2.4 MB                10 published      │
│  [View sitemap]     43 WebP · 2 PNG · 2 SVG    titles carried 10 │
│                     · 1 GIF                                      │
│  Accessibility pass (beta)   applied to 0 of 16 components …     │
│  Responsiveness pass (beta)  applied to 0 of 16 components …     │
└──────────────────────────────────────────────────────────────────┘

 Page                       SEO        Images          Access.(β)  Resp.(β)
 /                          carried    11 · WebP, SVG  0 of 7      0 of 7
 /apartments/…/amenities    carried     9 · WebP, SVG  0 of 6      0 of 6
```

- **The build steps** (tenant, theme, components, images, pages) move into a collapsed "How it was
  built" under the result. They are still there, but not the first thing seen.
- **Nothing shows as having run that did not.** The zero wording carries the reason, and "View site"
  says it is the preview address.

## Not built, not deployed

Everything above waits for the report to come back. The deploy of the work already committed (the
data fixes, the per-page heading level and alt, the drawn sizes, the beta lines) also waits for a
direct go-ahead.

## Built 2026-10-12 (not deployed)

Decisions taken: the sitemap on the source domain; zero lines at both levels; mobile back on as the
responsiveness pass, with the new wording; the responsiveness instruction approved. **No deploy before
the 16th.**

- **The seventh instruction** (`quality.responsive`) is a candidate line, off by default. Its pass is
  recorded and counted like the others. Wherever it is shown, the Site step says it is generic, with no
  mobile capture behind it.
- **The sitemap** lists `<source origin><migrated path>` and records its domain. The Site step reads
  "Sitemap for www.71westlandapts.com: 10 pages, live once the domain points at this site".
  - A sitemap written before this, with preview addresses, says so and asks to be regenerated by
    publishing again.
  - A site published before sitemaps existed says "not generated", with why.
- **The result is read live** by one query, `pageCompositionPocSiteResult`, from the site's tenant (its
  pages, Library and File Manager) and the run it was published from (its components' records and its
  approval).
  - The site-wide counts are taken over the same pages as the page list, so the two always agree.
  - The pass count recorded at publish last round is removed, so there is one source.
- **Zero is said at both levels, with why.** The pass lines read "not applied. This site's (page's)
  components were generated before it existed."
  - **Flag for when the instructions are turned on:** "before it existed" stays true only while nothing
    is generated with the instructions off. A component generated without them after they exist would
    need "without it".
- **Presentation:**
  - **At the top:** a `Widget` with the six lines and "View site". Its tooltip calls the address a
    preview address, and the site's own domain the source site's.
  - **The page list:** a design-system `Table` with columns for title and description, images,
    accessibility, performance and responsiveness. The `BetaBadge` sits on the pass columns' headers,
    and each cell's full sentence is in a tooltip.
  - **The build steps** fold under "How it was built" once a build is done, and stay open while one
    runs or after one failed.

### Not verified in the running admin

The view needs the new query, which is part of the held API deploy, so it has not been seen running.
What is verified:

- `siteResult` on the real fixtures of the two sites (5 tests, 2 shown to fail under mutation);
- the wording on their real figures (8 tests);
- all three packages build and pass their suites.

**The first deploy after the 16th should include a browser check of the Site step on 71 Westland and
the rehearsal.**
