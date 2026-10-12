# Site qualities on the Site step: scoping

This is a report only. Nothing is built, and no prompt has changed. The Webiny MCP server and skills
were used: the routing guide, `webiny-website-builder` and `webiny-page-settings-extensions`.

The data comes from two real runs, read on 2026-10-12:

- **71 Westland:** the rehearsal run `6ac902f3…#0001`, 10 pages.
- **Take 3:** run `6aca0300…#0001`, 8 pages.

For each run I read the capture artifact, every page's element tree, the stored raw HTML and the narrow
screenshots. The image figures come from 71 Westland's site tenant File Manager.

## What capture holds, measured

| Fact                                      | 71 Westland           | Take 3               | Reaches Generate?                                                                          |
| ----------------------------------------- | --------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| Images with non-empty `alt`               | **90 of 90**          | **43 of 43**         | Partly: prop defaults and unbound images, yes; image facts and object/list file fields, no |
| `h1` per page                             | exactly 1 on 10 pages | exactly 1 on 8 pages | **No.** Generate gets "the largest is the section's heading at N px"                       |
| Heading tags                              | 10 h1, 35 h2          | 8 h1, 18 h2          | No                                                                                         |
| Form `<label>` text                       | 33 labels             | 15 labels            | As plain text to preserve; nothing says which field a label belongs to                     |
| Placeholders, `label for`, ARIA, `:focus` | not recorded          | not recorded         | No                                                                                         |
| Meta description                          | **10 of 10 pages**    | **8 of 8 pages**     | No. It is only in the stored raw HTML, which nothing reads                                 |
| `<title>`                                 | recorded              | recorded             | Not to Generate; composition writes it as the page title                                   |
| Canonical, `og:*`, `lang`                 | in the raw HTML       | in the raw HTML      | No                                                                                         |
| Narrow viewport (390×844)                 | full-page screenshot  | full-page screenshot | **No**                                                                                     |
| Image rendered size                       | element box           | element box          | Yes, in px                                                                                 |
| Image natural size, `srcset`, `loading`   | not recorded          | not recorded         | No                                                                                         |

Corrections to the brief's premises:

- **Form labels are captured.** A screen-reader `<label>`'s text is in the tree, right before its
  input. Only the pairing and the placeholders are missing.
- **"Generation already receives alt" is true for most images, not all.** It is dropped in two places:
  - for a file field inside an object or list (`componentGeneration.ts:785`);
  - in the image-fact lines (`:507`).

  The composed page carries alt only where the component has a text field named for it, which
  composition fills per page (`deriveCompositeInputs.ts:207`).

## 1. What each prompt item can instruct

### Mobile responsiveness: nothing to work from yet

- **What exists:** the narrow pass stores one full-page PNG per page. It has no element tree and no
  boxes (`PageCaptureService.ts:53`, `:228`). It is a separate page load, with nothing linking it to the
  desktop tree.
- **What Generate needs:** Generate works one section at a time from a desktop crop. Without section
  boxes at 390px, there is no way to cut the matching narrow crop.
- **What the prompt says today:** one generic line from the shared Webiny prompt, "Include responsive
  styles using `@media` queries for smaller screens" (`buildComponentPrompt.ts:367`). The model invents
  the mobile layout without seeing it.
- **The rule therefore applies:** no new instruction.
- **What the prompt could carry once capture supports it:** the section's 390px crop as a second
  reference image, with an instruction to match its stacking order, what collapses (the menu becomes a
  hamburger) and its type sizes.

### Accessibility: four of five sub-items have data

| Sub-item          | Data                                                                                      | Instruction it supports                                                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alt text          | 100% coverage on both sites; in the prompt for most images                                | Render every image's alt from an input, never hard-coded. **First, close the two gaps above.**                                                                                 |
| Semantic elements | Tag names are in the tree but do not reach Generate                                       | **Generic:** button for actions, a for links, nav for navigation, lists for lists. **Source-derived:** only after the section's tags are passed through Plan                   |
| Heading order     | One h1 per page and each section's heading tag are in the tree, but do not reach Generate | Use the source's heading level for the section's heading. **Needs that level passed through first.** Today the prompt has only a size                                          |
| Form labels       | Label text yes; pairing no                                                                | Every field gets a label carrying the source's label text. Pairing by document order holds on both sites                                                                       |
| Focus states      | **None**                                                                                  | Only a generic rule: never remove the focus outline. The prompt already says "Include hover/focus states" (`:369`). A rule to copy the source's focus style would have no data |

### SEO: almost all composition, not Generate

- **What is there:** title and meta description exist for every page on both sites.
  - The title already becomes the page title.
  - The description sits unread in the raw HTML.
- **Where it belongs:** in composition. The page's `seo.title` and `seo.description` (`properties.seo`)
  are what the website renders (`generateMetadata`). Composition writes only `{ title, path }`
  (`CompositionWriter.ts:817`).
- **It is a deterministic copy, so it can be built for real, without the beta label.**
- **Do not copy the canonical,** which points at the old domain.
- **The only prompt part is heading levels,** which is the accessibility item's.

### Performance: two narrow instructions

- **Image dimensions:** set `width` and `height` on every `<img>` from the file input's `width` and
  `height`. The Website Builder file value carries both, so this needs no capture data.
- **Markup weight:** no wrapper elements the layout does not need.
- **Not a blanket `loading="lazy"`:** the component does not know where it sits on the page, and a
  lazy hero image slows the first view.
- **What the prompt does not touch:** component bundle weight. That is bounded by the site tenant's own
  size, with the re-approval window as stated in the design.

## 2. The six items: wording for approval

| Item          | Wording on the Site step                                                                                                                                                                        | Label |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Sitemap       | **Sitemap generated: 10 pages.** Before the first publish: "Generated when the site is published."                                                                                              | none  |
| Images        | **Images: 48 files, 2.4 MB (43 WebP, 2 PNG, 2 SVG, 1 GIF), kept in the format the source site served.**                                                                                         | none  |
| Page titles   | **Page titles and descriptions carried over from the source site: 10 of 10 pages.**                                                                                                             | none  |
| Accessibility | **Accessibility pass applied in generation: semantic elements, alt text from the source site, form labels, heading levels. Not checked against WCAG.**                                          | beta  |
| Performance   | **Performance pass applied in generation: image dimensions set, lean markup.**                                                                                                                  | beta  |
| Mobile        | **Mobile layout pass applied in generation: each component generated from its desktop and 390px captures.** Only if the narrow capture is made usable (item 3). Otherwise the item is not shown | beta  |

- **Images is not "Image optimisation".** The pipeline does not compress or resize anything. The WebP
  is the source CDN's, and `srcset` is not carried. "Optimisation" would be the 57-of-57 problem again.
- **Accessibility: why "Not checked against WCAG"** sits beside the beta label: one source site
  displays a WCAG 2.2 AA badge, and its image alt text says so.
- **The three "applied in generation" items are true only for runs generated with that prompt.** They
  must be recorded on the Generate artifact and shown only for such runs. On 71 Westland and the other
  inherited sites, whose components predate the prompt, they would be false.

## 3. The narrow viewport capture

**Usable as a picture of the page, not as data per component.**

- **The image is good:** 390×4,539 px at 1×. It is clean, with no overlay, and the mobile layout is
  visible: the hamburger menu, the stacked cards, the sticky bottom bar.
- **One stitching artefact:** a blank band of about 650 px above the sticky bottom bar.
- **What is missing:** no tree and no boxes, so no section can be cut from it.

**To make it usable:**

1. Run the evaluator on the narrow pass too (`NARROW_EVALUATOR` returns `tree: null` today), and store
   the narrow tree.
2. Match each desktop section to its narrow counterpart. Text and image sources work well, because
   both loads hold the same content.
3. Crop it beside the desktop crop.

This changes capture. **Existing runs have no narrow tree, so a site must be re-captured to benefit.**

## 4. What the sitemap needs

- **Generated at publish, in the API.** One step in `BuildSiteTask`, on both the legacy and the
  new-style path, built from the tenant's published pages. The API can read publish dates, which the
  website SDK's `listPages` does not select.
- **Written as `sitemap.xml` in the site tenant's File Manager.** That gives it a URL the Site step can
  link to. The alternative is the site record, which is invisible.
- **Nothing serves it at `/sitemap.xml` today.** Serving it there needs four things:
  - **A website route:** `app/sitemap.xml/route.ts`, reading the tenant from the existing middleware
    (`/sitemap.xml` is inside its matcher).
  - **A base URL for `<loc>`:** there is no per-site base URL. The OG URL is hardcoded to
    `example.com` (`page.tsx:69`). For the demo, the App Runner URL plus the path.
  - **A host-to-tenant mapping:** a crawler sends no tenant cookie, so it gets `root` unless the URL
    carries `?wb.tenant=`.
  - **A replacement `robots.txt`:** the website's static one is starter boilerplate. It disallows
    everything (`Disallow: /*`) and points at `http://localhost:3000/sitemap.xml`.

  The route and the `robots.txt` change are a website redeploy.

## What touches the demo path

Everything except the wording:

- the sitemap, images and title steps change publishing;
- the three generation items change component output and need a Generate re-run to show;
- serving the sitemap is a website redeploy.

## Estimate (my elapsed time)

| Work                                                                                                                 | Mine         | Pace set by                                                                            |
| -------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| Sitemap at publish, in File Manager, on the Site step                                                                | about 1.5 h  | an API and admin deploy; a publish to verify                                           |
| Serving it: website route, robots.txt                                                                                | about 1 h    | an image build and App Runner deploy                                                   |
| Images line                                                                                                          | about 45 min | one deploy                                                                             |
| Titles and descriptions onto pages                                                                                   | about 1.5 h  | a re-publish, read twice                                                               |
| Accessibility and performance: close the alt gaps, pass tags and levels through, prompt text, record on the artifact | about 3 h    | an offline replay over all components; one Generate run (about 45 min plus model cost) |
| Mobile: narrow tree, section matching, second reference image                                                        | 4–6 h        | a re-capture and a Generate run per site                                               |
