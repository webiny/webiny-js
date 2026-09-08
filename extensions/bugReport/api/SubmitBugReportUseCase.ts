import { SubmitBugReportUseCase as Abstraction } from "./abstractions.js";
import { BugReportConfig } from "./config/abstractions.js";
import { IssueDrafter } from "./drafter/abstractions.js";
import { GitHubIssueGateway } from "./github/abstractions.js";
import { formatTimeline } from "./formatTimeline.js";
import { composeIssueBody } from "./composeIssueBody.js";
import { buildComposeUrl } from "./buildComposeUrl.js";
import type { IIssueDraft } from "./drafter/abstractions.js";
import type { IBugReportOutcome } from "../shared/types.js";
import type { IBugReportPayload } from "../shared/types.js";

class SubmitBugReportUseCaseImpl implements Abstraction.Interface {
    constructor(
        private config: BugReportConfig.Interface,
        private drafter: IssueDrafter.Interface,
        private github: GitHubIssueGateway.Interface
    ) {}

    /*
     * Drafting happens either way. Only the ending differs: with a token the API files the issue
     * and uploads the screenshots; without one it hands back a prefilled composer URL for the
     * reporter to submit themselves.
     */
    async execute(payload: IBugReportPayload): Promise<IBugReportOutcome> {
        const timeline = formatTimeline(payload.events, payload.reportedAt);
        const draft = await this.drafter.execute(payload, timeline);

        if (!this.config.canFileDirectly) {
            const url = buildComposeUrl({
                repository: this.config.repository,
                labels: this.config.labels,
                draft,
                payload
            });

            return { mode: "compose", url, number: null };
        }

        return this.file(payload, draft, timeline);
    }

    private async file(
        payload: IBugReportPayload,
        draft: IIssueDraft,
        timeline: string
    ): Promise<IBugReportOutcome> {
        // Sequential on purpose: the first upload may have to create the assets branch, and
        // concurrent creates race into a 422.
        const screenshotUrls: string[] = [];
        for (const screenshot of payload.screenshots) {
            const url = await this.github.uploadScreenshot(screenshot);
            screenshotUrls.push(url);
        }

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

        return { mode: "filed", url: issue.url, number: issue.number };
    }
}

export const SubmitBugReportUseCase = Abstraction.createImplementation({
    implementation: SubmitBugReportUseCaseImpl,
    dependencies: [BugReportConfig, IssueDrafter, GitHubIssueGateway]
});
