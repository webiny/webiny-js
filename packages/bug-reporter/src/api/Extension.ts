import { createFeature } from "@webiny/feature/api";
import { BugReportConfig } from "./config/BugReportConfig.js";
import { IssueDrafter } from "./drafter/IssueDrafter.js";
import { GitHubIssueGateway } from "./github/GitHubIssueGateway.js";
import { SubmitBugReportRoute } from "./SubmitBugReportRoute.js";

/*
 * Named `Extension`, matching the filename, because that is what the extension codegen imports.
 * It decides named-vs-default by parsing the BUILT js at the `src` path with a bare ts-morph
 * Project (see project/src/extensions/ApiExtension.ts). That does not resolve a default export
 * out of js, so `export default` from a package silently produces a broken named import.
 */
export const Extension = createFeature({
    name: "BugReporter/Api",
    register(container) {
        container.register(BugReportConfig);
        container.register(IssueDrafter);
        container.register(GitHubIssueGateway);
        container.register(SubmitBugReportRoute);
    }
});
