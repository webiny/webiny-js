import { createFeature } from "@webiny/feature/api";
import { BugReportConfig } from "./config/BugReportConfig.js";
import { IssueDrafter } from "./drafter/IssueDrafter.js";
import { GitHubIssueGateway } from "./github/GitHubIssueGateway.js";
import { SubmitBugReportUseCase } from "./SubmitBugReportUseCase.js";
import { BugReportGraphQLSchema } from "./BugReportGraphQLSchema.js";

export default createFeature({
    name: "BugReporter/Api",
    register(container) {
        container.register(BugReportConfig);
        container.register(IssueDrafter);
        container.register(GitHubIssueGateway);
        container.register(SubmitBugReportUseCase);
        container.register(BugReportGraphQLSchema);
    }
});
