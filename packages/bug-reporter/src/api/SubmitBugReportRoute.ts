import { HttpRoute, toSseFrame } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponseBuilder } from "@webiny/event-handler-core";
import { BugReportConfig } from "./config/abstractions.js";
import { IssueDrafter } from "./drafter/abstractions.js";
import { GitHubIssueGateway } from "./github/abstractions.js";
import { formatTimeline } from "./formatTimeline.js";
import { composeIssueBody } from "./composeIssueBody.js";
import { buildComposeUrl } from "./buildComposeUrl.js";
import type { IBugReportPayload } from "../shared/types.js";
import type { IReportedEvent } from "../shared/types.js";
import type { IReportedScreenshot } from "../shared/types.js";

function describeFailure(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function readEvents(value: unknown): IReportedEvent[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const events: IReportedEvent[] = [];
    for (const item of value) {
        if (!item || typeof item !== "object") {
            continue;
        }
        const candidate = item as Partial<IReportedEvent>;
        if (typeof candidate.kind === "string" && typeof candidate.summary === "string") {
            events.push({
                at: typeof candidate.at === "number" ? candidate.at : Date.now(),
                kind: candidate.kind,
                summary: candidate.summary,
                detail: typeof candidate.detail === "string" ? candidate.detail : undefined
            });
        }
    }

    return events;
}

function readScreenshots(value: unknown): IReportedScreenshot[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const screenshots: IReportedScreenshot[] = [];
    for (const item of value) {
        if (!item || typeof item !== "object") {
            continue;
        }
        const candidate = item as Partial<IReportedScreenshot>;
        if (typeof candidate.mediaType === "string" && typeof candidate.base64 === "string") {
            screenshots.push({ mediaType: candidate.mediaType, base64: candidate.base64 });
        }
    }

    return screenshots;
}

/*
 * Everything the browser sends is untrusted, and a bad field must not take the stream down after
 * it has committed to a 200. Anything unrecognised is dropped rather than rejected: a report with
 * a mangled event is still worth filing. Returns null only when there is nothing to report at all.
 */
function readPayload(body: unknown): IBugReportPayload | null {
    if (!body || typeof body !== "object") {
        return null;
    }

    const source = body as Record<string, unknown>;
    const environment = source.environment;

    if (!environment || typeof environment !== "object") {
        return null;
    }

    const description = typeof source.description === "string" ? source.description.trim() : "";
    const screenshots = readScreenshots(source.screenshots);

    if (description === "" && screenshots.length === 0) {
        return null;
    }

    return {
        description,
        reportedAt: typeof source.reportedAt === "number" ? source.reportedAt : Date.now(),
        events: readEvents(source.events),
        environment: environment as IBugReportPayload["environment"],
        screenshots
    };
}

/*
 * Files a bug report, streaming progress as server-sent events.
 *
 * Streamed rather than answered in one shot because the work is slow and someone is watching: a
 * model call, then an upload per screenshot, then the issue itself. The dialog stays open and
 * narrates each step.
 *
 * A background task would be the wrong tool twice over. There is somebody to stream to, and the
 * payload carries base64 screenshots — routinely megabytes — which cannot go into a task's
 * persisted `input` under DynamoDB's 400 kB item cap.
 *
 * Validation happens BEFORE the response opens, so a malformed body comes back as a real 400. Once
 * the first frame is out the status is committed to 200 and failures can only be an `error` event.
 */
class SubmitBugReportRouteImpl implements HttpRoute.Interface {
    readonly method = "POST";
    readonly path = "/stream/bug-report";

    constructor(
        private config: BugReportConfig.Interface,
        private drafter: IssueDrafter.Interface,
        private github: GitHubIssueGateway.Interface
    ) {}

    async handle(
        request: IHttpRequest,
        response: IHttpResponseBuilder
    ): Promise<IHttpResponseBuilder> {
        const payload = readPayload(request.body);

        if (!payload) {
            return response
                .status(400)
                .json({ message: "A report needs a description or at least one screenshot." });
        }

        return response.sse(this.report(payload));
    }

    private async *report(payload: IBugReportPayload): AsyncGenerator<string> {
        const timeline = formatTimeline(payload.events, payload.reportedAt);

        yield toSseFrame({ type: "drafting" });

        try {
            const draft = await this.drafter.execute(payload, timeline);

            if (!this.config.canFileDirectly) {
                const url = buildComposeUrl({
                    repository: this.config.repository,
                    labels: this.config.labels,
                    draft,
                    payload
                });

                yield toSseFrame({ type: "compose", url });
                return;
            }

            // Sequential on purpose: the first upload may have to create the assets branch, and
            // concurrent creates race into a 422.
            const screenshotUrls: string[] = [];
            for (const screenshot of payload.screenshots) {
                yield toSseFrame({
                    type: "uploading",
                    index: screenshotUrls.length + 1,
                    total: payload.screenshots.length
                });
                const url = await this.github.uploadScreenshot(screenshot);
                screenshotUrls.push(url);
            }

            yield toSseFrame({ type: "creating" });

            const body = composeIssueBody({
                draft,
                description: payload.description,
                environment: payload.environment,
                timeline,
                screenshotUrls
            });

            const issue = await this.github.createIssue({
                title: draft.title,
                body,
                labels: this.config.labels
            });

            yield toSseFrame({ type: "filed", url: issue.url, number: issue.number });
        } catch (error) {
            yield toSseFrame({ type: "error", message: describeFailure(error) });
        }
    }
}

export const SubmitBugReportRoute = HttpRoute.createImplementation({
    implementation: SubmitBugReportRouteImpl,
    dependencies: [BugReportConfig, IssueDrafter, GitHubIssueGateway]
});
