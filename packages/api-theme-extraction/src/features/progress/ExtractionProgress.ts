/**
 * What the user sees while extraction runs — see the design brief, section 10.7.
 *
 * Extraction takes minutes and reads a site nobody can watch it read, so the progress report is the
 * only evidence it is working. That makes two things matter more than they usually would: the
 * percentage must never go backwards, and each message must name what is happening to *their* site
 * rather than describing our pipeline.
 *
 * The weights below are the crux. Crawling takes most of the wall-clock, so if every step got an
 * equal share the bar would jump to 60% and then appear frozen for two minutes — the exact shape that
 * makes a working process look hung.
 */

export const EXTRACTION_STEPS = [
    "queued",
    "checking-rules",
    "launching-browser",
    "crawling",
    "analysing",
    "creating-theme",
    "done"
] as const;

export type ExtractionStep = (typeof EXTRACTION_STEPS)[number];

/** Share of the total each step accounts for. Ordered, and summing to 1. */
const STEP_WEIGHTS: Record<ExtractionStep, number> = {
    queued: 0,
    "checking-rules": 0.03,
    "launching-browser": 0.07,
    crawling: 0.6,
    analysing: 0.22,
    "creating-theme": 0.08,
    done: 0
};

export interface ExtractionProgressState {
    step: ExtractionStep;
    /** Set during crawling, so the bar moves per page rather than once per phase. */
    pagesDone?: number;
    pagesTotal?: number;
}

const stepIndex = (step: ExtractionStep): number => EXTRACTION_STEPS.indexOf(step);

/**
 * A whole-number percentage, monotonic in step order.
 *
 * Computed by summing the weights of completed steps and interpolating within the current one, so it
 * cannot regress as long as steps are reported in order.
 */
export const progressPercent = ({
    step,
    pagesDone,
    pagesTotal
}: ExtractionProgressState): number => {
    if (step === "done") {
        return 100;
    }

    const index = stepIndex(step);
    let completed = 0;
    for (const candidate of EXTRACTION_STEPS) {
        if (stepIndex(candidate) < index) {
            completed += STEP_WEIGHTS[candidate];
        }
    }

    // Within crawling, interpolate across pages. Elsewhere there is nothing finer to report, so the
    // step's own weight is credited on completion rather than part-way through.
    let withinStep = 0;
    if (step === "crawling" && pagesTotal && pagesTotal > 0) {
        withinStep = STEP_WEIGHTS.crawling * Math.min(1, (pagesDone ?? 0) / pagesTotal);
    }

    return Math.min(99, Math.round((completed + withinStep) * 100));
};

export interface ExtractionProgressMessage {
    extractionId: string;
    step: ExtractionStep;
    percent: number;
    /** Written for the person who pressed the button, not for a log. */
    message: string;
    pagesDone?: number;
    pagesTotal?: number;
}

/** The websocket action clients subscribe to. */
export const EXTRACTION_PROGRESS_ACTION = "theme.extraction.progress";
export const EXTRACTION_FAILED_ACTION = "theme.extraction.failed";
export const EXTRACTION_DONE_ACTION = "theme.extraction.done";

export interface DescribeParams extends ExtractionProgressState {
    /** The site being read, so the message names their site and not ours. */
    host?: string;
    currentUrl?: string;
}

export const describeStep = ({
    step,
    pagesDone,
    pagesTotal,
    host,
    currentUrl
}: DescribeParams): string => {
    const site = host ?? "the site";

    switch (step) {
        case "queued":
            return "Waiting to start…";
        case "checking-rules":
            return `Checking what ${site} allows us to read…`;
        case "launching-browser":
            return "Starting a browser…";
        case "crawling": {
            const counted =
                pagesTotal && pagesTotal > 0
                    ? ` (page ${Math.min((pagesDone ?? 0) + 1, pagesTotal)} of ${pagesTotal})`
                    : "";
            // Naming the page being read is what makes a long step feel like it is moving.
            return currentUrl ? `Reading ${currentUrl}${counted}…` : `Reading ${site}${counted}…`;
        }
        case "analysing":
            return "Working out the colours, type and spacing…";
        case "creating-theme":
            return "Building your theme…";
        case "done":
            return "Done.";
    }
};
