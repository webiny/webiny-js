import { formatTimeline } from "./formatTimeline.js";
import { composeIssueBody } from "./composeIssueBody.js";
import { IssueDrafter } from "./drafter/abstractions.js";
import type { IBugReportPayload } from "../shared/types.js";

/*
 * The whole report has to survive as a query string, so the timeline is the part that gets cut.
 * Around 76 encoded characters per event puts 60 events near 6 kB, comfortably under the ~8 kB
 * a GET URL can be relied on to carry. The recent end is the useful end, so we keep the tail.
 */
const MAX_TIMELINE_EVENTS = 60;

/*
 * The ceiling the whole URL has to fit under. Capping the timeline alone was not enough: the
 * description is whatever the reporter typed, and with drafting on, the summary and steps are
 * whatever a model wrote. Either can run long, and an over-long URL loses the entire report to a
 * GitHub error page after the tab has already opened.
 */
const MAX_URL_LENGTH = 8000;

const TRUNCATION_NOTE =
    "\n\n_Trimmed to fit a URL. The full timeline is in the reporter's browser._";

const SCREENSHOT_NOTE = [
    "> [!IMPORTANT]",
    "> Paste your screenshot here before submitting. Images cannot be carried in a URL, so it",
    "> could not be attached for you. It should still be on your clipboard."
].join("\n");

export interface IBuildComposeUrlInput {
    repository: string;
    labels: string[];
    draft: IssueDrafter.Draft;
    payload: IBugReportPayload;
}

/*
 * Builds a GitHub "new issue" URL with the report prefilled. Nothing is created: the reporter
 * opens it, pastes their screenshot, and submits under their own account. This is the path when
 * the API has no GitHub token, so it needs no credentials at all.
 */
export function buildComposeUrl(input: IBuildComposeUrlInput): string {
    const recentEvents = input.payload.events.slice(-MAX_TIMELINE_EVENTS);
    const timeline = formatTimeline(recentEvents, input.payload.reportedAt);

    const issueBody = composeIssueBody({
        draft: input.draft,
        description: input.payload.description,
        environment: input.payload.environment,
        timeline,
        screenshotUrls: []
    });

    const sections: string[] = [];
    if (input.payload.screenshots.length > 0) {
        sections.push(SCREENSHOT_NOTE);
    }
    sections.push(issueBody);

    /*
     * Labels are best effort here: GitHub drops them for anyone without push access, and an unknown
     * label cannot be created without a token.
     */
    const body = sections.join("\n\n");
    const base = `https://github.com/${input.repository}/issues/new`;
    const labels = input.labels.join(",");

    return buildUrl(base, input.draft.title, body, labels);
}

function buildUrl(base: string, title: string, body: string, labels: string): string {
    const full = toUrl(base, title, body, labels);
    if (full.length <= MAX_URL_LENGTH) {
        return full;
    }

    /*
     * Trim the body until the whole thing fits. Binary search rather than a fixed guess, because
     * how many characters a byte of body costs depends entirely on what is in it — a stack trace
     * full of slashes and colons encodes at three characters each, prose at one.
     */
    let low = 0;
    let high = body.length;

    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        const candidate = `${body.slice(0, middle)}${TRUNCATION_NOTE}`;
        if (toUrl(base, title, candidate, labels).length <= MAX_URL_LENGTH) {
            low = middle;
        } else {
            high = middle - 1;
        }
    }

    return toUrl(base, title, `${body.slice(0, low)}${TRUNCATION_NOTE}`, labels);
}

function toUrl(base: string, title: string, body: string, labels: string): string {
    const params = new URLSearchParams({ title, body, labels });
    return `${base}?${params.toString()}`;
}
