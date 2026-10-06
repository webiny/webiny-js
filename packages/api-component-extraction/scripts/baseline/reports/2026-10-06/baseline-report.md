# Migration pipeline baseline

Generated 2026-10-06T15:25:42.295Z from the runs recorded in `state.json`. Prices from the table dated 2026-10-06 (`src/domain/modelCost.ts`); cache rates marked "assumed" there are the standard multipliers, not published figures.

**No Kentico site is in this set.** Four sites are on G5 Marketing Cloud and one on RealPage LeaseStar, identified from public asset and API hosts.

## Summary

| site | platform | components | passed without problems | not generated / no output | height outside 0.67–1.5x | spend |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| www.71westlandapts.com | G5 Marketing Cloud | 10 | 5 (50%) | 0 | 2 of 10 | $3.33 |
| thevibe-apts.com | RealPage LeaseStar | 31 | 27 (87%) | 0 | 4 of 31 | $5.86 |
| www.parkcityplace.org | G5 Marketing Cloud | 8 | 4 (50%) | 0 | 1 of 8 | $1.52 |
| promo.freehillstreetlofts.com | G5 Marketing Cloud (promo landing site) | 8 | 2 (25%) | 0 | 1 of 7 | $2.16 |
| www.2424tulane.com | G5 Marketing Cloud | 11 | 5 (45%) | 1 | 5 of 10 | $4.06 |
| **all** | | **68** | **43 (63%)** | **1** | **13 of 66 (20%)** | **$16.92** |

"Passed without problems" is a machine reading: generated, every validator green, rendered, height within 0.67–1.5x of the source section, at least one image where the section showed any, and no broken image. Images are counted as distinct sources visible inside the section box on the source side and as distinct images the render used on the other; a partial shortfall is listed as information, not a failure, because a box-based count cannot see which stacked carousel slide is on top. It is not Realpage's measure; that needs the verdicts in the review sheet. Components with no output count as failures here and in every share below.

## Main failure patterns

| pattern | components |
| --- | ---: |
| height outside 0.67–1.5x of source | 13 |
| no image where the section showed one | 6 |
| validators: textPreservation | 4 |
| broken images | 4 |
| rendered blank (no height) | 1 |
| no result recorded: the component task did not finish | 1 |

## www.71westlandapts.com

Platform: **G5 Marketing Cloud** (inferred from g5-assets-cld-res.cloudinary.com, themes.g5dxm.com, call-tracking-edge.g5marketingcloud.com).

Job `6ac4f6bafa4b3a00028bb8ea#0001`, run `6ac4f6bdfa4b3a00028bb8eb#0001`, status done. Theme `6ab2534661ea650002f10a72` v1.

| pages captured | pages failed | sections | clusters | components planned | generated | no output |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 0 | 54 | 10 | 10 | 10 | 0 |

**Capture and crop warnings**

| warning | count |
| --- | ---: |
| page screenshot cut short (taller than 32000px) | 0 |
| page with web fonts that failed to load | 0 |
| page with web fonts still loading after 5s | 0 |
| page with an overlay still present | 0 |
| page with broken images | 0 |
| section with no crop (outside the screenshot) | 0 |
| section with a partial crop | 0 |
| section with no screenshot to crop from | 0 |
| section crop not at true scale | 0 |

**Timings**

| stage | time |
| --- | ---: |
| discover | 0.1 min |
| capture | 3.9 min |
| segment | 0.2 min |
| cluster | 0.2 min |
| classify | 0.3 min |
| plan | 3.1 min |
| generate | 15.4 min |
| assemble | 0.0 min |
| promote | 0.2 min |
| render pass | 1.0 min |

**Components**

| # | component | type | pages | attempts | validators | height (render/source) | images (rendered/expected) | crop | Generate cost | result | side by side |
| ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | ---: | --- | --- |
| 1 | phone number block | other | 10 | 2 | B✓ T✓ C✓ K✓ | 1.48x | 0/0 | ok | $0.07 | passed | [source](images/www-71westlandapts-com/01-phone-number-block-source.png) · [render](images/www-71westlandapts-com/01-phone-number-block-render.png) |
| 2 | Site Navigation Header | header | 10 | 2 | B✓ T✓ C✓ K✓ | 0.60x | 1/1 | ok | $0.24 | height 0.60x of source | [source](images/www-71westlandapts-com/02-site-navigation-header-source.png) · [render](images/www-71westlandapts-com/02-site-navigation-header-render.png) |
| 3 | Welcome Hero Banner | hero | 1 | 2 | B✓ T✓ C✓ K✓ | 0.94x | 3/3 | ok | $0.22 | passed | [source](images/www-71westlandapts-com/03-welcome-hero-banner-source.png) · [render](images/www-71westlandapts-com/03-welcome-hero-banner-render.png) |
| 4 | Hero Intro | hero | 2 | 2 | B✓ T✓ C✓ K✓ | 1.08x | 0/0 | ok | $0.30 | passed | [source](images/www-71westlandapts-com/04-hero-intro-source.png) · [render](images/www-71westlandapts-com/04-hero-intro-render.png) |
| 5 | Intro/Explore Section | hero | 7 | 2 | B✓ T✓ C✓ K✓ | 2.26x | 0/0 | ok | $0.12 | height 2.26x of source | [source](images/www-71westlandapts-com/05-intro-explore-section-source.png) · [render](images/www-71westlandapts-com/05-intro-explore-section-render.png) |
| 6 | Property Footer with Contact & Hours | footer | 10 | 2 | B✓ T✓ C✓ K✓ | 0.91x | 0/5 | ok | $0.25 | no image (section showed 5) | [source](images/www-71westlandapts-com/06-property-footer-with-contact-hours-source.png) · [render](images/www-71westlandapts-com/06-property-footer-with-contact-hours-render.png) |
| 7 | Amenities Showcase | gallery | 6 | 2 | B✓ T✓ C✓ K✓ | 1.11x | 1/1 | ok | $0.11 | passed | [source](images/www-71westlandapts-com/07-amenities-showcase-source.png) · [render](images/www-71westlandapts-com/07-amenities-showcase-render.png) |
| 8 | Resident Portal CTA | cta | 1 | 2 | B✓ T✓ C✓ K✓ | 1.21x | 1/1 | ok | $0.21 | passed | [source](images/www-71westlandapts-com/08-resident-portal-cta-source.png) · [render](images/www-71westlandapts-com/08-resident-portal-cta-render.png) |
| 9 | Accessibility Statement | content | 2 | 3 | B✓ T✗ C✓ K✓ | 0.97x | 0/0 | ok | $0.09 | validators: textPreservation | [source](images/www-71westlandapts-com/09-accessibility-statement-source.png) · [render](images/www-71westlandapts-com/09-accessibility-statement-render.png) |
| 10 | Contact Form | form | 1 | 3 | B✓ T✗ C✓ K✓ | 0.86x | 0/1 | ok | $1.47 | validators: textPreservation; no image (section showed 1) | [source](images/www-71westlandapts-com/10-contact-form-source.png) · [render](images/www-71westlandapts-com/10-contact-form-render.png) |

Validators: B bundling, T text preservation, C contract conformance, K token binding.

**Model usage and cost**

| stage | model(s) | calls | input | cache read | cache write | output | cost | saved by caching |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| classify | anthropic/claude-sonnet-5 | 10 | 2960 | 0 | 0 | 333 | $0.01 | $0.00 |
| plan | anthropic/claude-sonnet-5 | 10 | 25764 | 0 | 0 | 19622 | $0.25 | $0.00 |
| generate | anthropic/claude-sonnet-5 | 25 | 498124 | 368784 | 15366 | 272950 | $3.07 | $0.66 |
| **total** | | 45 | 526848 | 368784 | 15366 | 292905 | **$3.33** | $0.66 |

Generate per component: $0.31 mean over 10 component(s), 2.50 calls each.

## thevibe-apts.com

Platform: **RealPage LeaseStar** (inferred from cs-cdn.realpage.com, capi.myleasestar.com, c-leasestar-api.realpage.com).

Job `6ac4d613daf3ad0002fc11cc#0001`, run `6ac4d615daf3ad0002fc11cd#0001`, status running. Theme `6ab25c89b1d62000028225e5` v1. Was a draft; published 2026-10-06 for this baseline. Publish reported advisory contrast warnings: primary text on sunken surface 1.12:1, primary action label 2.9:1 (light); destructive action label 1.81:1 (dark).

**Operator intervention:** At 11:41 UTC, 21 minutes into Generate, the operator stopped the Generate coordinator's and one component task's Step Functions executions on a misread of elapsed time (UTC log against local clock), then re-triggered Generate on the same run. The pipeline continued the same stage version: 28 finished components were kept and the remaining 3 completed (31 of 31 by 11:46). No output was edited.
**Operator intervention:** The re-trigger left a pipeline claim that never clears when a re-triggered task continues a running stage, which permanently blocks this run's Assemble and Promote. A pipeline defect, filed separately.
**Stages not run:** assemble, promote — blocked by the stale Generate claim left by the operator re-trigger; neither stage feeds this report, and nothing from this run was promoted to the Library.

| pages captured | pages failed | sections | clusters | components planned | generated | no output |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 9 | 0 | 82 | 33 | 31 | 31 | 0 |

**Capture and crop warnings**

| warning | count |
| --- | ---: |
| page screenshot cut short (taller than 32000px) | 0 |
| page with web fonts that failed to load | 0 |
| page with web fonts still loading after 5s | 0 |
| page with an overlay still present | 0 |
| page with broken images | 0 |
| section with no crop (outside the screenshot) | 0 |
| section with a partial crop | 3 |
| section with no screenshot to crop from | 0 |
| section crop not at true scale | 0 |

**Timings**

| stage | time |
| --- | ---: |
| discover | 0.1 min |
| capture | 4.4 min |
| segment | 0.4 min |
| cluster | 0.1 min |
| classify | 1.1 min |
| plan | 6.9 min |
| generate | 25.7 min |
| assemble | n/a |
| promote | n/a |
| render pass | 2.6 min |

**Components**

| # | component | type | pages | attempts | validators | height (render/source) | images (rendered/expected) | crop | Generate cost | result | side by side |
| ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | ---: | --- | --- |
| 1 | Site header with address, phone, and CTA buttons | header | 9 | 2 | B✓ T✓ C✓ K✓ | 1.05x | 1/1 | ok | $0.49 | passed | [source](images/thevibe-apts-com/01-site-header-with-address-phone-and-cta-buttons-source.png) · [render](images/thevibe-apts-com/01-site-header-with-address-phone-and-cta-buttons-render.png) |
| 2 | Carousel/Slider with Navigation | gallery | 1 | 2 | B✓ T✓ C✓ K✓ | 0.90x | 1/1 | ok | $0.18 | passed | [source](images/thevibe-apts-com/02-carousel-slider-with-navigation-source.png) · [render](images/thevibe-apts-com/02-carousel-slider-with-navigation-render.png) |
| 3 | Navigation Links | header | 1 | 2 | B✓ T✓ C✓ K✓ | 1.03x | 3/3 | ok | $0.07 | passed | [source](images/thevibe-apts-com/03-navigation-links-source.png) · [render](images/thevibe-apts-com/03-navigation-links-render.png) |
| 4 | Hero Intro | hero | 1 | 2 | B✓ T✓ C✓ K✓ | 0.99x | 1/2 | ok | $0.37 | passed | [source](images/thevibe-apts-com/04-hero-intro-source.png) · [render](images/thevibe-apts-com/04-hero-intro-render.png) |
| 5 | Image Block | other | 1 | 2 | B✓ T✓ C✓ K✓ | 0.76x | 1/1 | ok | $0.05 | passed | [source](images/thevibe-apts-com/05-image-block-source.png) · [render](images/thevibe-apts-com/05-image-block-render.png) |
| 6 | Image Slideshow | gallery | 1 | 2 | B✓ T✓ C✓ K✓ | 1.01x | 1/1 | ok | $0.15 | passed | [source](images/thevibe-apts-com/06-image-slideshow-source.png) · [render](images/thevibe-apts-com/06-image-slideshow-render.png) |
| 7 | Community Amenities | features | 1 | 2 | B✓ T✓ C✓ K✓ | 0.90x | 0/0 | ok | $0.09 | passed | [source](images/thevibe-apts-com/07-community-amenities-source.png) · [render](images/thevibe-apts-com/07-community-amenities-render.png) |
| 8 | Neighborhood Overview | content | 1 | 2 | B✓ T✓ C✓ K✓ | 0.69x | 1/1 | ok | $0.08 | passed | [source](images/thevibe-apts-com/08-neighborhood-overview-source.png) · [render](images/thevibe-apts-com/08-neighborhood-overview-render.png) |
| 9 | Social Media Follow CTA | cta | 1 | 2 | B✓ T✓ C✓ K✓ | 0.67x | 0/0 | ok | $0.08 | passed | [source](images/thevibe-apts-com/09-social-media-follow-cta-source.png) · [render](images/thevibe-apts-com/09-social-media-follow-cta-render.png) |
| 10 | Image Block | other | 7 | 1 | B✓ T✓ C✓ K✓ | 0.97x | 1/1 | ok | $0.04 | passed | [source](images/thevibe-apts-com/10-image-block-source.png) · [render](images/thevibe-apts-com/10-image-block-render.png) |
| 11 | Contact Info & Get In Touch Form | form | 8 | 2 | B✓ T✓ C✓ K✓ | 1.22x | 1/1 | ok | $0.34 | passed | [source](images/thevibe-apts-com/11-contact-info-get-in-touch-form-source.png) · [render](images/thevibe-apts-com/11-contact-info-get-in-touch-form-render.png) |
| 12 | Call to Action - Lease Now | cta | 8 | 2 | B✓ T✓ C✓ K✓ | 0.43x | 0/0 | ok | $0.13 | height 0.43x of source | [source](images/thevibe-apts-com/12-call-to-action-lease-now-source.png) · [render](images/thevibe-apts-com/12-call-to-action-lease-now-render.png) |
| 13 | Social & Contact Links | footer | 8 | 2 | B✓ T✓ C✓ K✓ | 0.96x | 0/0 | ok | $0.11 | passed | [source](images/thevibe-apts-com/13-social-contact-links-source.png) · [render](images/thevibe-apts-com/13-social-contact-links-render.png) |
| 14 | Footer with contact info and hours | footer | 9 | 3 | B✓ T✗ C✓ K✓ | 0.50x | 1/2 | ok | $0.43 | validators: textPreservation; height 0.50x of source | [source](images/thevibe-apts-com/14-footer-with-contact-info-and-hours-source.png) · [render](images/thevibe-apts-com/14-footer-with-contact-info-and-hours-render.png) |
| 15 | Hero Section | hero | 5 | 2 | B✓ T✓ C✓ K✓ | 1.00x | 1/1 | ok | $0.05 | passed | [source](images/thevibe-apts-com/15-hero-section-source.png) · [render](images/thevibe-apts-com/15-hero-section-render.png) |
| 16 | Interior Highlights Text Section | content | 1 | 2 | B✓ T✓ C✓ K✓ | 1.19x | 0/0 | ok | $0.07 | passed | [source](images/thevibe-apts-com/16-interior-highlights-text-section-source.png) · [render](images/thevibe-apts-com/16-interior-highlights-text-section-render.png) |
| 17 | Photo Gallery with Layout Options | gallery | 1 | 2 | B✓ T✓ C✓ K✓ | 0.13x | 12/47 | ok | $0.31 | height 0.13x of source | [source](images/thevibe-apts-com/17-photo-gallery-with-layout-options-source.png) · [render](images/thevibe-apts-com/17-photo-gallery-with-layout-options-render.png) |
| 18 | Contact Form | form | 1 | 2 | B✓ T✓ C✓ K✓ | 0.84x | 1/1 | ok | $0.33 | passed | [source](images/thevibe-apts-com/18-contact-form-source.png) · [render](images/thevibe-apts-com/18-contact-form-render.png) |
| 19 | Take a Tour / Lease Now CTA | cta | 1 | 2 | B✓ T✓ C✓ K✓ | 0.87x | 1/1 | ok | $0.17 | passed | [source](images/thevibe-apts-com/19-take-a-tour-lease-now-cta-source.png) · [render](images/thevibe-apts-com/19-take-a-tour-lease-now-cta-render.png) |
| 20 | Hero Statement | hero | 2 | 1 | B✓ T✓ C✓ K✓ | 1.00x | 1/1 | ok | $0.02 | passed | [source](images/thevibe-apts-com/20-hero-statement-source.png) · [render](images/thevibe-apts-com/20-hero-statement-render.png) |
| 21 | Community Amenities | features | 1 | 2 | B✓ T✓ C✓ K✓ | 1.10x | 0/0 | ok | $0.06 | passed | [source](images/thevibe-apts-com/21-community-amenities-source.png) · [render](images/thevibe-apts-com/21-community-amenities-render.png) |
| 22 | Image with Details | other | 1 | 2 | B✓ T✓ C✓ K✓ | 1.04x | 1/1 | ok | $0.06 | passed | [source](images/thevibe-apts-com/22-image-with-details-source.png) · [render](images/thevibe-apts-com/22-image-with-details-render.png) |
| 23 | Amenities Tabs/List | features | 1 | 2 | B✓ T✓ C✓ K✓ | 0.77x | 0/0 | ok | $0.26 | passed | [source](images/thevibe-apts-com/23-amenities-tabs-list-source.png) · [render](images/thevibe-apts-com/23-amenities-tabs-list-render.png) |
| 24 | Intro/Description Section | content | 1 | 2 | B✓ T✓ C✓ K✓ | 1.20x | 0/0 | ok | $0.04 | passed | [source](images/thevibe-apts-com/24-intro-description-section-source.png) · [render](images/thevibe-apts-com/24-intro-description-section-render.png) |
| 25 | Photo Gallery Preview | gallery | 1 | 1 | B✓ T✓ C✓ K✓ | 1.19x | 3/3 | ok | $0.03 | passed | [source](images/thevibe-apts-com/25-photo-gallery-preview-source.png) · [render](images/thevibe-apts-com/25-photo-gallery-preview-render.png) |
| 26 | Intro Text Section | content | 1 | 2 | B✓ T✓ C✓ K✓ | 1.03x | 0/0 | ok | $0.08 | passed | [source](images/thevibe-apts-com/26-intro-text-section-source.png) · [render](images/thevibe-apts-com/26-intro-text-section-render.png) |
| 27 | Floor Plan Pricing List | pricing | 1 | 2 | B✓ T✓ C✓ K✓ | 0.29x | 0/27 | ok | $0.65 | height 0.29x of source; no image (section showed 27) | [source](images/thevibe-apts-com/27-floor-plan-pricing-list-source.png) · [render](images/thevibe-apts-com/27-floor-plan-pricing-list-render.png) |
| 28 | Neighborhood Overview with Category Filters | content | 2 | 1 | B✓ T✓ C✓ K✓ | 0.78x | 1/1 | ok | $0.23 | passed | [source](images/thevibe-apts-com/28-neighborhood-overview-with-category-filters-source.png) · [render](images/thevibe-apts-com/28-neighborhood-overview-with-category-filters-render.png) |
| 29 | Accessibility Statement | content | 1 | 1 | B✓ T✓ C✓ K✓ | 0.96x | 0/0 | ok | $0.02 | passed | [source](images/thevibe-apts-com/29-accessibility-statement-source.png) · [render](images/thevibe-apts-com/29-accessibility-statement-render.png) |
| 30 | Navigation Menu | header | 1 | 2 | B✓ T✓ C✓ K✓ | 0.87x | 0/0 | ok | $0.05 | passed | [source](images/thevibe-apts-com/30-navigation-menu-source.png) · [render](images/thevibe-apts-com/30-navigation-menu-render.png) |
| 31 | Contact/Social Footer Section | footer | 1 | 2 | B✓ T✓ C✓ K✓ | 0.94x | 0/0 | ok | $0.16 | passed | [source](images/thevibe-apts-com/31-contact-social-footer-section-source.png) · [render](images/thevibe-apts-com/31-contact-social-footer-section-render.png) |

Validators: B bundling, T text preservation, C contract conformance, K token binding.

**Model usage and cost**

| stage | model(s) | calls | input | cache read | cache write | output | cost | saved by caching |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| classify | anthropic/claude-sonnet-5 | 33 | 9256 | 0 | 0 | 1154 | $0.03 | $0.00 |
| plan | anthropic/claude-sonnet-5 | 31 | 72841 | 0 | 0 | 44961 | $0.60 | $0.00 |
| generate | anthropic/claude-sonnet-5 | 59 | 1172418 | 891228 | 15366 | 448160 | $5.23 | $1.60 |
| **total** | | 123 | 1254515 | 891228 | 15366 | 494275 | **$5.86** | $1.60 |

Generate per component: $0.17 mean over 31 component(s), 1.90 calls each.

## www.parkcityplace.org

Platform: **G5 Marketing Cloud** (inferred from g5-assets-cld-res.cloudinary.com, themes.g5dxm.com, client-leads.g5marketingcloud.com).

Job `6ac4fd14a47cf10002f5ebba#0001`, run `6ac4fd16a47cf10002f5ebbb#0001`, status done. Theme `6ab119a704782f0002001bd6` v1.

| pages captured | pages failed | sections | clusters | components planned | generated | no output |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 8 | 0 | 46 | 8 | 8 | 8 | 0 |

**Capture and crop warnings**

| warning | count |
| --- | ---: |
| page screenshot cut short (taller than 32000px) | 0 |
| page with web fonts that failed to load | 0 |
| page with web fonts still loading after 5s | 0 |
| page with an overlay still present | 0 |
| page with broken images | 0 |
| section with no crop (outside the screenshot) | 0 |
| section with a partial crop | 0 |
| section with no screenshot to crop from | 0 |
| section crop not at true scale | 0 |

**Timings**

| stage | time |
| --- | ---: |
| discover | 0.1 min |
| capture | 5.2 min |
| segment | 0.2 min |
| cluster | 0.1 min |
| classify | 0.3 min |
| plan | 2.0 min |
| generate | 7.9 min |
| assemble | 0.0 min |
| promote | 0.1 min |
| render pass | 0.8 min |

**Components**

| # | component | type | pages | attempts | validators | height (render/source) | images (rendered/expected) | crop | Generate cost | result | side by side |
| ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | ---: | --- | --- |
| 1 | Site Navigation Header | header | 8 | 2 | B✓ T✓ C✓ K✓ | 0.90x | 1/1 | ok | $0.22 | passed | [source](images/www-parkcityplace-org/01-site-navigation-header-source.png) · [render](images/www-parkcityplace-org/01-site-navigation-header-render.png) |
| 2 | Hero Banner | hero | 1 | 2 | B✓ T✓ C✓ K✓ | 0.98x | 0/3 | ok | $0.10 | no image (section showed 3) | [source](images/www-parkcityplace-org/02-hero-banner-source.png) · [render](images/www-parkcityplace-org/02-hero-banner-render.png) |
| 3 | Contact/Apply Bar | cta | 8 | 1 | B✓ T✓ C✓ K✓ | 1.23x | 0/0 | ok | $0.03 | passed | [source](images/www-parkcityplace-org/03-contact-apply-bar-source.png) · [render](images/www-parkcityplace-org/03-contact-apply-bar-render.png) |
| 4 | Property Description | content | 3 | 1 | B✓ T✓ C✓ K✓ | 1.07x | 3/4 | ok | $0.24 | passed | [source](images/www-parkcityplace-org/04-property-description-source.png) · [render](images/www-parkcityplace-org/04-property-description-render.png) |
| 5 | Property Highlights Links | features | 1 | 2 | B✓ T✓ C✓ K✓ | 1.08x | 1/3 | ok | $0.10 | 3 broken image(s) | [source](images/www-parkcityplace-org/05-property-highlights-links-source.png) · [render](images/www-parkcityplace-org/05-property-highlights-links-render.png) |
| 6 | Neighborhood/Location Highlight | content | 6 | 2 | B✓ T✓ C✓ K✓ | 1.16x | 1/1 | ok | $0.27 | passed | [source](images/www-parkcityplace-org/06-neighborhood-location-highlight-source.png) · [render](images/www-parkcityplace-org/06-neighborhood-location-highlight-render.png) |
| 7 | Hero Banner | hero | 4 | 2 | B✓ T✓ C✓ K✓ | 0.99x | 0/0 | ok | $0.06 | 1 broken image(s) | [source](images/www-parkcityplace-org/07-hero-banner-source.png) · [render](images/www-parkcityplace-org/07-hero-banner-render.png) |
| 8 | Site Footer | footer | 8 | 2 | B✓ T✓ C✓ K✓ | 0.65x | 2/2 | ok | $0.34 | height 0.65x of source | [source](images/www-parkcityplace-org/08-site-footer-source.png) · [render](images/www-parkcityplace-org/08-site-footer-render.png) |

Validators: B bundling, T text preservation, C contract conformance, K token binding.

**Model usage and cost**

| stage | model(s) | calls | input | cache read | cache write | output | cost | saved by caching |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| classify | anthropic/claude-sonnet-5 | 8 | 2365 | 0 | 0 | 267 | $0.01 | $0.00 |
| plan | anthropic/claude-sonnet-5 | 8 | 19719 | 0 | 0 | 12048 | $0.16 | $0.00 |
| generate | anthropic/claude-sonnet-5 | 14 | 283323 | 199758 | 15366 | 114036 | $1.36 | $0.35 |
| **total** | | 30 | 305407 | 199758 | 15366 | 126351 | **$1.52** | $0.35 |

Generate per component: $0.17 mean over 8 component(s), 1.75 calls each.

## promo.freehillstreetlofts.com

Platform: **G5 Marketing Cloud (promo landing site)** (inferred from g5-assets-cld-res.cloudinary.com, client-leads.g5marketingcloud.com, g5-enhanced-form). Supplied as https://promo.freehillstreetlofts.com/#/ — the fragment is dropped by every URL normaliser and the site uses no hash routing. Two pages: home and privacy policy. The main site (www.freehillstreetlofts.com, apts247/ResMan) is out of scope.

Job `6ac50184236932000221b5d7#0001`, run `6ac50186236932000221b5d8#0001`, status done. Theme `6ab25f9d74d623000233f463` v1.

| pages captured | pages failed | sections | clusters | components planned | generated | no output |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | 0 | 11 | 8 | 8 | 8 | 0 |

**Capture and crop warnings**

| warning | count |
| --- | ---: |
| page screenshot cut short (taller than 32000px) | 0 |
| page with web fonts that failed to load | 0 |
| page with web fonts still loading after 5s | 0 |
| page with an overlay still present | 0 |
| page with broken images | 2 |
| section with no crop (outside the screenshot) | 0 |
| section with a partial crop | 0 |
| section with no screenshot to crop from | 0 |
| section crop not at true scale | 0 |

**Timings**

| stage | time |
| --- | ---: |
| discover | 0.1 min |
| capture | 2.6 min |
| segment | 0.1 min |
| cluster | 0.1 min |
| classify | 0.3 min |
| plan | 2.1 min |
| generate | 11.1 min |
| assemble | 0.0 min |
| promote | 0.1 min |
| render pass | 0.8 min |

**Components**

| # | component | type | pages | attempts | validators | height (render/source) | images (rendered/expected) | crop | Generate cost | result | side by side |
| ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | ---: | --- | --- |
| 1 | Contact Info | footer | 2 | 1 | B✓ T✓ C✓ K✓ | 2.30x | 0/0 | ok | $0.05 | height 2.30x of source | [source](images/promo-freehillstreetlofts-com/01-contact-info-source.png) · [render](images/promo-freehillstreetlofts-com/01-contact-info-render.png) |
| 2 | Site Header | header | 2 | 2 | B✓ T✓ C✓ K✓ | 1.11x | 1/0 | ok | $0.18 | 1 broken image(s) | [source](images/promo-freehillstreetlofts-com/02-site-header-source.png) · [render](images/promo-freehillstreetlofts-com/02-site-header-render.png) |
| 3 | Hero Banner | hero | 1 | 2 | B✓ T✓ C✓ K✓ | 1.00x | 0/4 | ok | $0.11 | no image (section showed 4) | [source](images/promo-freehillstreetlofts-com/03-hero-banner-source.png) · [render](images/promo-freehillstreetlofts-com/03-hero-banner-render.png) |
| 4 | Contact Form with Map View | form | 1 | 2 | B✓ T✓ C✓ K✓ | 0.85x | 0/2 | ok | $0.43 | no image (section showed 2) | [source](images/promo-freehillstreetlofts-com/04-contact-form-with-map-view-source.png) · [render](images/promo-freehillstreetlofts-com/04-contact-form-with-map-view-render.png) |
| 5 | Amenities Highlights | features | 1 | 2 | B✓ T✓ C✓ K✓ | 1.24x | 2/2 | ok | $0.30 | passed | [source](images/promo-freehillstreetlofts-com/05-amenities-highlights-source.png) · [render](images/promo-freehillstreetlofts-com/05-amenities-highlights-render.png) |
| 6 | Footer Contact & Office Hours | footer | 2 | 2 | B✓ T✓ C✓ K✓ | 0.79x | 1/1 | ok | $0.29 | passed | [source](images/promo-freehillstreetlofts-com/06-footer-contact-office-hours-source.png) · [render](images/promo-freehillstreetlofts-com/06-footer-contact-office-hours-render.png) |
| 7 | Image with Figure | gallery | 1 | 1 | B✓ T✓ C✓ K✓ | n/a | 1/1 | ok | $0.03 | rendered blank (no height); 1 broken image(s) | [source](images/promo-freehillstreetlofts-com/07-image-with-figure-source.png) · [render](images/promo-freehillstreetlofts-com/07-image-with-figure-render.png) |
| 8 | Privacy Policy | content | 1 | 3 | B✓ T✗ C✓ K✓ | 1.33x | 0/0 | ok | $0.58 | validators: textPreservation | [source](images/promo-freehillstreetlofts-com/08-privacy-policy-source.png) · [render](images/promo-freehillstreetlofts-com/08-privacy-policy-render.png) |

Validators: B bundling, T text preservation, C contract conformance, K token binding.

**Model usage and cost**

| stage | model(s) | calls | input | cache read | cache write | output | cost | saved by caching |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| classify | anthropic/claude-sonnet-5 | 8 | 2943 | 0 | 0 | 260 | $0.01 | $0.00 |
| plan | anthropic/claude-sonnet-5 | 8 | 20070 | 0 | 0 | 13262 | $0.17 | $0.00 |
| generate | anthropic/claude-sonnet-5 | 15 | 314310 | 199758 | 30732 | 169052 | $1.97 | $0.34 |
| **total** | | 31 | 337323 | 199758 | 30732 | 182574 | **$2.16** | $0.34 |

Generate per component: $0.25 mean over 8 component(s), 1.88 calls each.

## www.2424tulane.com

Platform: **G5 Marketing Cloud** (inferred from g5-assets-cld-res.cloudinary.com, themes.g5dxm.com, call-tracking-edge.g5marketingcloud.com).

Job `6ac506281a44130002685644#0001`, run `6ac5062a1a44130002685645#0001`, status done. Theme `6ab26b4838a369000286400d` v1.

| pages captured | pages failed | sections | clusters | components planned | generated | no output |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 11 | 0 | 72 | 11 | 11 | 10 | 1 |

**Capture and crop warnings**

| warning | count |
| --- | ---: |
| page screenshot cut short (taller than 32000px) | 0 |
| page with web fonts that failed to load | 0 |
| page with web fonts still loading after 5s | 0 |
| page with an overlay still present | 0 |
| page with broken images | 0 |
| section with no crop (outside the screenshot) | 0 |
| section with a partial crop | 0 |
| section with no screenshot to crop from | 0 |
| section crop not at true scale | 0 |

**Timings**

| stage | time |
| --- | ---: |
| discover | 0.1 min |
| capture | 7.4 min |
| segment | 0.3 min |
| cluster | 0.2 min |
| classify | 0.4 min |
| plan | 2.8 min |
| generate | 23.8 min |
| assemble | 0.0 min |
| promote | 0.2 min |
| render pass | 0.9 min |

**Components**

| # | component | type | pages | attempts | validators | height (render/source) | images (rendered/expected) | crop | Generate cost | result | side by side |
| ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | ---: | --- | --- |
| 1 | Site Header Navigation | header | 9 | 2 | B✓ T✓ C✓ K✓ | 2.56x | 2/1 | ok | $0.81 | height 2.56x of source | [source](images/www-2424tulane-com/01-site-header-navigation-source.png) · [render](images/www-2424tulane-com/01-site-header-navigation-render.png) |
| 2 | Specials section | other | 11 | 1 | B✓ T✓ C✓ K✓ | 0.16x | 0/0 | ok | $0.02 | height 0.16x of source | [source](images/www-2424tulane-com/02-specials-section-source.png) · [render](images/www-2424tulane-com/02-specials-section-render.png) |
| 3 | Hero banner with CTA | hero | 1 | 2 | B✓ T✓ C✓ K✓ | 0.81x | 1/1 | ok | $0.11 | passed | [source](images/www-2424tulane-com/03-hero-banner-with-cta-source.png) · [render](images/www-2424tulane-com/03-hero-banner-with-cta-render.png) |
| 4 | Property Highlights Links | features | 11 | 2 | B✓ T✓ C✓ K✓ | 8.90x | 4/1 | ok | $0.12 | height 8.90x of source | [source](images/www-2424tulane-com/04-property-highlights-links-source.png) · [render](images/www-2424tulane-com/04-property-highlights-links-render.png) |
| 5 | Hero Intro Section | hero | 3 | 2 | B✓ T✓ C✓ K✓ | 1.03x | 15/2 | ok | $1.17 | passed | [source](images/www-2424tulane-com/05-hero-intro-section-source.png) · [render](images/www-2424tulane-com/05-hero-intro-section-render.png) |
| 6 | Amenities List | features | 1 | 2 | B✓ T✓ C✓ K✓ | 1.24x | 0/0 | ok | $0.06 | passed | [source](images/www-2424tulane-com/06-amenities-list-source.png) · [render](images/www-2424tulane-com/06-amenities-list-render.png) |
| 7 | Property Description with Scores | content | 7 | 2 | B✓ T✓ C✓ K✓ | 1.45x | 1/0 | ok | $0.28 | passed | [source](images/www-2424tulane-com/07-property-description-with-scores-source.png) · [render](images/www-2424tulane-com/07-property-description-with-scores-render.png) |
| 8 | Footer with contact info and office hours | footer | 11 | 2 | B✓ T✓ C✓ K✓ | 1.34x | 1/1 | ok | $0.29 | passed | [source](images/www-2424tulane-com/08-footer-with-contact-info-and-office-hours-source.png) · [render](images/www-2424tulane-com/08-footer-with-contact-info-and-office-hours-render.png) |
| 9 | Site Header/Navigation | header | 2 | 2 | B✓ T✓ C✓ K✓ | 7.32x | 2/1 | ok | $0.93 | height 7.32x of source | [source](images/www-2424tulane-com/09-site-header-navigation-source.png) · [render](images/www-2424tulane-com/09-site-header-navigation-render.png) |
| 10 | Hero Banner | hero | 1 | 2 | B✓ T✓ C✓ K✓ | 1.93x | 0/0 | ok | $0.04 | height 1.93x of source | [source](images/www-2424tulane-com/10-hero-banner-source.png) · [render](images/www-2424tulane-com/10-hero-banner-render.png) |
| 11 | Floor Plan Filter | form | 1 | n/a | — | n/a | n/a/3 | ok | $0.00 | no result recorded: the component task did not finish | [source](images/www-2424tulane-com/11-floor-plan-filter-source.png) · no render |

Validators: B bundling, T text preservation, C contract conformance, K token binding.

**Components with no output (counted as failures)**

- Floor Plan Filter (`73a28a507358`): no result recorded: the component task did not finish

**Model usage and cost**

| stage | model(s) | calls | input | cache read | cache write | output | cost | saved by caching |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| classify | anthropic/claude-sonnet-5 | 11 | 3161 | 0 | 0 | 363 | $0.01 | $0.00 |
| plan | anthropic/claude-sonnet-5 | 11 | 27021 | 0 | 0 | 17861 | $0.23 | $0.00 |
| generate | anthropic/claude-sonnet-5 | 25 | 522878 | 368784 | 15366 | 342536 | $3.81 | $0.66 |
| **total** | | 47 | 553060 | 368784 | 15366 | 360760 | **$4.06** | $0.66 |

Generate per component: $0.38 mean over 10 component(s), 2.50 calls each.

## Across all sites

- Components: 68; generated 67; no output 1.
- Passed without problems: 43 (63%).
- Every validator green: 63 (93%).
- Height outside 0.67–1.5x of source: 13 of 66 rendered (20%); too tall 6, too short 7.
- Mean height ratio: 1.24x; mean attempts: 1.91.
- Images: 6 component(s) show no image where their section showed one; 4 have a broken image; 5 show fewer images than were visible in the section (information only: Hero Intro 1/2, Footer with contact info and hours 1/2, Photo Gallery with Layout Options 12/47, Property Description 3/4, Property Highlights Links 1/3).
- Spend: $16.92 over 276 model calls; cache read 2028312 and write 92196 input tokens; caching saved $3.60.
- Models used: classify: anthropic/claude-sonnet-5; generate: anthropic/claude-sonnet-5; plan: anthropic/claude-sonnet-5.

## Sibling segmentation across the G5 sites

Four of the five sites are on G5 Marketing Cloud. This compares how Segment cut them, from the runs' own trees and section boxes; no model was called. Sections are compared by layout alone — tag structure and geometry, without colours, since each site has its own theme — using the clustering similarity at its default 0.85 threshold.

| site | pages | sections | sections/page | sections 800–1000px tall (container-split flip risk) | sections under 160px |
| --- | ---: | ---: | ---: | ---: | ---: |
| www.71westlandapts.com | 10 | 54 | 5.4 | 1 | 20 |
| www.parkcityplace.org | 8 | 46 | 5.8 | 1 | 16 |
| promo.freehillstreetlofts.com | 2 | 11 | 5.5 | 0 | 4 |
| www.2424tulane.com | 11 | 72 | 6.5 | 22 | 4 |

Share of each site's sections with a layout match (similarity ≥ 0.85) somewhere on the other site:

| site \ against | www.71westlandapts.com | www.parkcityplace.org | promo.freehillstreetlofts.com | www.2424tulane.com |
| --- | ---: | ---: | ---: | ---: |
| www.71westlandapts.com | — | 28% | 28% | 56% |
| www.parkcityplace.org | 63% | — | 61% | 63% |
| promo.freehillstreetlofts.com | 36% | 27% | — | 45% |
| www.2424tulane.com | 53% | 49% | 61% | — |

Pages present on two or more G5 sites, by path — sections per page, and how many of each site's sections on that page match one on the same page of another site:

| page | www.71westlandapts.com | www.parkcityplace.org | promo.freehillstreetlofts.com | www.2424tulane.com |
| --- | --- | --- | --- | --- |
| `/` | 7 sections, 4 matched | 9 sections, 7 matched | 6 sections, 4 matched | 12 sections, 8 matched |

Boundaries Segment considered and rejected, by reason:

- www.71westlandapts.com: too-few-siblings 42, too-short 18, too-narrow 13, parent-below-max-height 4
- www.parkcityplace.org: too-narrow 48, too-few-siblings 29, too-short 9, parent-below-max-height 2
- promo.freehillstreetlofts.com: too-short 39, too-few-siblings 7, too-narrow 3, parent-below-max-height 2
- www.2424tulane.com: too-few-siblings 58, too-narrow 28, too-short 11, children-overlap 4, parent-below-max-height 2
