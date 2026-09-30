import type { ComposedCaptureDto, ComposedCapturePageDto, PageMapDto } from "~/shared/types.js";

/**
 * Whether this run's composed screenshots exist, and whether they are of the composition on screen.
 *
 * Three states, not two, and the middle one is why this file exists. A capture that photographed an
 * earlier composition is not the same thing as no capture: it is real evidence about a page that has
 * since been rebuilt. Hiding it would lose the evidence; showing it plainly would present another
 * composition's pages as this one's. So it is shown, marked, with both versions named.
 */
export type CaptureState =
    | { kind: "absent" }
    | { kind: "current"; capture: ComposedCaptureDto }
    | { kind: "stale"; capture: ComposedCaptureDto; captured: number; composed: number };

export const captureState = (
    map: PageMapDto | null,
    capture: ComposedCaptureDto | null
): CaptureState => {
    if (!capture) {
        return { kind: "absent" };
    }

    /*
     * Both default to 0 for the compositions written before the version counter existed. Read that
     * way, a capture of one of those against a map of one of those compares equal and reads current,
     * which is the most that can honestly be said: neither side can name which composition it was.
     */
    const composed = map?.composeVersion ?? 0;
    const captured = capture.composeVersion ?? 0;

    return captured === composed
        ? { kind: "current", capture }
        : { kind: "stale", capture, captured, composed };
};

/** What the capture says about one page. `none` means the capture predates this page existing. */
export type PageCapture =
    | { kind: "none" }
    | { kind: "captured"; screenshotRef: string; viewportWidth?: number }
    | { kind: "skipped"; reason: string };

export const pageCapture = (capture: ComposedCaptureDto | null, path: string): PageCapture => {
    const page: ComposedCapturePageDto | undefined = capture?.pages.find(
        candidate => candidate.path === path
    );
    if (!page) {
        return { kind: "none" };
    }
    if (page.status === "captured" && page.screenshotRef) {
        return {
            kind: "captured",
            screenshotRef: page.screenshotRef,
            viewportWidth: page.viewportWidth
        };
    }
    return {
        kind: "skipped",
        // A skip without a reason should not be possible; if it happens, say that rather than nothing.
        reason: page.reason || "the harness recorded no reason for skipping this page"
    };
};

/** How the capture was produced, in a sentence, so its origin is never left to be inferred. */
export const provenance = (capture: ComposedCaptureDto): string => {
    const when = new Date(capture.capturedAt).toLocaleString();
    const how =
        capture.source === "local-harness"
            ? "a developer's local harness run"
            : `the ${capture.source} capture`;
    return `Composed screenshots came from ${how} on ${when}, at ${capture.viewportWidth}px wide.`;
};
