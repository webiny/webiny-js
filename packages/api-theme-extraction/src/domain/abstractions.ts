import type { FontResource, Screenshot } from "@webiny/site-capture";
import type { CandidateLink, SampledElement } from "~/index.js";

/**
 * The per-page snapshot theme extraction works from.
 *
 * Browser access itself now lives behind `@webiny/site-capture`'s `BrowserProvider`, which runs the
 * visit sequence and returns a generic `CaptureResult` whose `result` is whatever in-page evaluator it
 * was handed. The crawl maps that result — our token sampler's `SampleResult` — onto this shape, so
 * everything downstream (observations, payload, logging) is unchanged by the extraction of the browser.
 */
export interface PageSnapshot {
    url: string;
    /** The URL actually landed on, after redirects. */
    finalUrl: string;
    status: number;
    title: string;
    /** Same-origin links found in the nav and footer, for crawl selection. */
    links: CandidateLink[];
    /**
     * The sampled elements, exactly as the page reported them.
     *
     * Deliberately not weighted observations. Weighting is a decision — area for backgrounds, glyphs
     * for text — and it belongs in `toObservations` where it is unit tested, not in whichever browser
     * happened to read the page.
     */
    elements: SampledElement[];
    /** How many elements matched before the per-page cap, so we can report what was sampled. */
    candidateCount: number;
    /** Font files the network log shows were really loaded, not merely declared in CSS. */
    fontResources: FontResource[];
    screenshots: Screenshot[];
    /**
     * Labels of screenshots that were requested but could not be captured.
     *
     * A missing crop degrades what the model sees without failing the crawl, so it has to be reported
     * somewhere — otherwise the model's input looks complete when it is not.
     */
    failedScreenshots: string[];
    /**
     * Overlays hidden before sampling, described well enough to identify.
     *
     * Reported rather than kept quiet because this is the step most likely to have removed something it
     * should not have. "Why is the brand colour missing from my theme?" is answerable from this list and
     * very hard to answer without it.
     */
    dismissedOverlays: string[];
}
