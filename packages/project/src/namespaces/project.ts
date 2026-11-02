import { ProjectId, Telemetry, FeatureFlags, BugReporter } from "~/extensions/index.js";
import { AutoInstall } from "~/extensions/aws/index.js";

export const Project = {
    Id: ProjectId,
    Telemetry,
    AutoInstall,
    FeatureFlags,
    BugReporter
};
