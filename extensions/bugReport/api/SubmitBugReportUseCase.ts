import { SubmitBugReportUseCase as Abstraction } from "./abstractions.js";
import { IssueDrafter } from "./drafter/abstractions.js";
import { GitHubIssueGateway } from "./github/abstractions.js";
import { formatTimeline } from "./formatTimeline.js";
import { composeIssueBody } from "./composeIssueBody.js";
import type { IBugReportPayload } from "../shared/types.js";
import type { IFiledIssue } from "../shared/types.js";

class SubmitBugReportUseCaseImpl implements Abstraction.Interface {
    constructor(
        private drafter: IssueDrafter.Interface,
        private github: GitHubIssueGateway.Interface
    ) {}

    async execute(payload: IBugReportPayload): Promise<IFiledIssue> {
        if (!this.github.configured) {
            throw new Error(
                "Bug reporting is not configured on this environment. BUG_REPORT_GITHUB_TOKEN and BUG_REPORT_REPOSITORY have to be set."
            );
        }

        const timeline = formatTimeline(payload.events, payload.reportedAt);
        const draft = await this.drafter.execute(payload, timeline);

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

        return this.github.createIssue({
            title: draft.title,
            body,
            labels: this.github.labels
        });
    }
}

export const SubmitBugReportUseCase = Abstraction.createImplementation({
    implementation: SubmitBugReportUseCaseImpl,
    dependencies: [IssueDrafter, GitHubIssueGateway]
});
