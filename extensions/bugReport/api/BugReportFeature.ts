import { createFeature } from "webiny/api";
import { IssueDrafter } from "./drafter/IssueDrafter.js";
import { GitHubIssueGateway } from "./github/GitHubIssueGateway.js";
import { SubmitBugReportUseCase } from "./SubmitBugReportUseCase.js";

export default createFeature({
    name: "BugReport/Api",
    register(container) {
        container.register(IssueDrafter);
        container.register(GitHubIssueGateway);
        container.register(SubmitBugReportUseCase);
    }
});
