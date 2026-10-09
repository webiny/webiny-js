/**
 * What a job's theme extraction is doing, in the words the run view and the stage gate show.
 *
 * The crawl reports before each page it reads, with the pages finished so far, so the count is pages
 * done, not the page in hand; and its total starts at the crawl limit and is revised to the pages
 * actually chosen, so it can drop. Checked against `CrawlSiteUseCase` (theme-in-pipeline-build-plan.md).
 */
export const describeCrawlProgress = (progress: {
    pagesDone: number;
    pagesTotal: number;
    currentUrl?: string;
}): string => {
    const read = `read ${progress.pagesDone} of ${progress.pagesTotal} page${progress.pagesTotal === 1 ? "" : "s"}`;
    if (!progress.currentUrl) {
        return read;
    }
    let path = progress.currentUrl;
    try {
        path = new URL(progress.currentUrl).pathname || "/";
    } catch {
        // keep the url as given
    }
    return `${read}, now reading ${path}`;
};

/** The stages that read the job's theme. Cluster is the first; Discover, Capture, Segment never do. */
export const THEME_READING_STAGES = new Set(["cluster", "plan", "generate", "assemble"]);

/**
 * Why a theme-reading stage cannot start yet, or null when the job has a pinned theme.
 *
 * Says what is happening and what the user can do: the run is never left waiting on something they
 * cannot see or act on.
 */
export const themeGateMessage = (job: {
    themeEntryId: string;
    themeExtraction: {
        status: string;
        step: string;
        error: string | null;
    } | null;
}): string | null => {
    if (job.themeEntryId) {
        return null;
    }
    const extraction = job.themeExtraction;
    if (!extraction) {
        return "This job has no theme yet: start a run to extract one from the site, or pick an existing theme.";
    }
    if (extraction.status === "failed") {
        return `This job's theme could not be extracted (${extraction.error ?? "no reason recorded"}). Retry it, or pick an existing theme.`;
    }
    if (extraction.status === "waiting") {
        return `The job's theme has not started: ${extraction.step}. Cluster can run once it is pinned.`;
    }
    return `The job's theme is still being extracted (${extraction.step || "starting"}). Cluster can run once it is published and pinned.`;
};

/** Whether starting a run should start the job's theme extraction. */
export const needsThemeExtraction = (job: {
    themeEntryId: string;
    themeExtraction: { status: string } | null;
}): boolean =>
    !job.themeEntryId && (!job.themeExtraction || job.themeExtraction.status === "failed");
