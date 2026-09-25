import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { BugReportConfig } from "../config/abstractions.js";
import { IssueDrafter } from "../drafter/abstractions.js";
import { GitHubIssueGateway } from "../github/abstractions.js";
import { formatTimeline } from "../formatTimeline.js";
import { composeIssueBody } from "../composeIssueBody.js";
import { buildComposeUrl } from "../buildComposeUrl.js";
import { SubmitBugReportUseCase as Abstraction } from "./abstractions.js";
import { BugReportEmptyError } from "./errors.js";
import { BugReportNotAuthorizedError } from "./errors.js";
import type { SubmitBugReportError } from "./errors.js";
import type { BugReportStreamEvent } from "../../shared/types.js";
import type { IBugReportPayload } from "../../shared/types.js";

function describeFailure(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function isEmpty(payload: IBugReportPayload): boolean {
    if (payload.description.trim() !== "") {
        return false;
    }
    return payload.screenshots.length === 0;
}

/*
 * Files a bug report, reporting progress as it goes.
 *
 * Yields domain events rather than SSE frames: the route owns the transport, and a caller that is
 * not HTTP — a test, most usefully — can drive this without one.
 */
export class SubmitBugReportUseCaseImpl implements Abstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private config: BugReportConfig.Interface,
        private drafter: IssueDrafter.Interface,
        private github: GitHubIssueGateway.Interface
    ) {}

    async execute(
        payload: IBugReportPayload
    ): Promise<Result<AsyncGenerator<BugReportStreamEvent>, SubmitBugReportError>> {
        /*
         * Filing runs under the server's GitHub token, so an anonymous caller must not get this
         * far. Checked here rather than in the route because this is the only place that knows
         * what the token is used for, and a decorator wrapping this inherits the check.
         */
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new BugReportNotAuthorizedError());
        }

        if (isEmpty(payload)) {
            return Result.fail(new BugReportEmptyError());
        }

        return Result.ok(this.report(payload));
    }

    private async *report(payload: IBugReportPayload): AsyncGenerator<BugReportStreamEvent> {
        const timeline = formatTimeline(payload.events, payload.reportedAt);

        yield { type: "drafting" };

        try {
            const draft = await this.drafter.execute(payload, timeline);

            if (!this.config.canFileDirectly) {
                const url = buildComposeUrl({
                    repository: this.config.repository,
                    labels: this.config.labels,
                    draft,
                    payload
                });

                yield { type: "compose", url };
                return;
            }

            const screenshotUrls = yield* this.uploadScreenshots(payload);

            yield { type: "creating" };

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

            yield { type: "filed", url: issue.url, number: issue.number };
        } catch (error) {
            yield { type: "error", message: describeFailure(error) };
        }
    }

    /*
     * Sequential on purpose: the first upload may have to create the assets branch, and concurrent
     * creates race into a 422.
     */
    private async *uploadScreenshots(
        payload: IBugReportPayload
    ): AsyncGenerator<BugReportStreamEvent, string[]> {
        const urls: string[] = [];

        for (const screenshot of payload.screenshots) {
            yield { type: "uploading", index: urls.length + 1, total: payload.screenshots.length };
            const url = await this.github.uploadScreenshot(screenshot);
            urls.push(url);
        }

        return urls;
    }
}

export const SubmitBugReportUseCase = Abstraction.createImplementation({
    implementation: SubmitBugReportUseCaseImpl,
    dependencies: [IdentityContext, BugReportConfig, IssueDrafter, GitHubIssueGateway]
});
