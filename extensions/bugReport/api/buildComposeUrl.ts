import { formatTimeline } from "./formatTimeline.js";
import { composeIssueBody } from "./composeIssueBody.js";
import type { IIssueDraft } from "./drafter/abstractions.js";
import type { IBugReportPayload } from "../shared/types.js";

/*
 * The whole report has to survive as a query string, so the timeline is the part that gets cut.
 * Around 76 encoded characters per event puts 60 events near 6 kB, comfortably under the ~8 kB
 * a GET URL can be relied on to carry. The recent end is the useful end, so we keep the tail.
 */
const MAX_TIMELINE_EVENTS = 60;

const SCREENSHOT_NOTE = [
    "> [!IMPORTANT]",
    "> Paste your screenshot here before submitting. Images cannot be carried in a URL, so it",
    "> could not be attached for you. It should still be on your clipboard."
].join("\n");

export interface IBuildComposeUrlInput {
    repository: string;
    labels: string[];
    draft: IIssueDraft;
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

    const body = composeIssueBody({
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
    sections.push(body);

    // Labels are best effort here: GitHub drops them for anyone without push access, and an
    // unknown label cannot be created without a token.
    const params = new URLSearchParams({
        title: input.draft.title,
        body: sections.join("\n\n"),
        labels: input.labels.join(",")
    });

    return `https://github.com/${input.repository}/issues/new?${params.toString()}`;
}
