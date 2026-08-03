import { createAbstraction } from "@webiny/feature/api";
import type { CandidateLink, SampledElement } from "~/index.js";

/**
 * Browser access sits behind this seam — see the design brief, section 10.2.
 *
 * Nothing above this interface knows whether the page was read by Chromium in a Lambda, by a hosted
 * rendering service, or by a fixture in a test. That matters more here than in most places: the
 * runtime story for headless Chromium differs between Webiny Cloud and self-hosted, and the crawl
 * logic must not have to care.
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

export interface FontResource {
    url: string;
    family?: string;
    weight?: string;
    style?: string;
}

export interface Screenshot {
    /** Where the bytes were written. Screenshots go to storage, never into the task payload. */
    key: string;
    label: string;
    width: number;
    height: number;
}

/**
 * Which part of the page to capture.
 *
 * Viewport-sized crops rather than one tall full-page image: a 6000px screenshot scaled down to the
 * model's longest-edge limit loses the type and spacing detail it was sent to judge.
 */
export type ScreenshotCrop = "above-fold" | "mid-page" | "footer" | "full-page";

export interface ScreenshotRequest {
    label: string;
    crop: ScreenshotCrop;
}

export interface ScreenshotCapture {
    requests: ScreenshotRequest[];
    /**
     * Persists the bytes and returns the storage key.
     *
     * Injected rather than resolved here so the browser layer never depends on storage — and so a
     * test can capture screenshots without writing anything.
     */
    write(image: Uint8Array, label: string): Promise<string>;
}

export interface CapturePageParams {
    url: string;
    /** Styles are sampled at one width only; a second width buys little and costs a page load. */
    viewportWidth: number;
    viewportHeight: number;
    /** Set for the dark-mode probe on the entry page. */
    emulateDarkMode?: boolean;
    /** Hard ceiling for this page. Every network operation must be able to time out. */
    timeoutMs: number;
    /**
     * Screenshots are taken only when this is supplied.
     *
     * One signal rather than a boolean alongside a writer: a flag that says "capture" with nowhere to
     * put the bytes has no correct behaviour.
     */
    screenshots?: ScreenshotCapture;
}

export interface IBrowserSession {
    capture(params: CapturePageParams): Promise<PageSnapshot>;
    close(): Promise<void>;
    /**
     * What the driver resolved at launch — for Chromium, which executable it found and where.
     *
     * Surfaced so it can be written to the task log. The layer's internal layout is the least-verified
     * thing in this feature, so "which binary actually ran" is the first question a failed extraction
     * raises, and it should not require reading CloudWatch to answer.
     */
    readonly diagnostics: Record<string, unknown>;
}

export interface IBrowserProvider {
    /**
     * Opens a session. Callers must `close()` it — a leaked browser in a Lambda is a leaked
     * invocation, and the container may be reused.
     */
    open(): Promise<IBrowserSession>;
    /** Human-readable, for progress reporting and for saying which backend failed. */
    readonly name: string;
}

export const BrowserProvider = createAbstraction<IBrowserProvider>("Theme/BrowserProvider");

export namespace BrowserProvider {
    export type Interface = IBrowserProvider;
    export type Session = IBrowserSession;
    export type Snapshot = PageSnapshot;
}
