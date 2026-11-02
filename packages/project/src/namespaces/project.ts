import { ProjectId, Telemetry, FeatureFlags, BugReporter } from "~/extensions/index.js";
import { AutoInstall } from "~/extensions/aws/index.js";
import { awsOnly } from "~/extensions/hosting/index.js";

export const Project = {
    Id: ProjectId,
    Telemetry,
    AutoInstall: awsOnly("Project.AutoInstall", AutoInstall),
    FeatureFlags,
    BugReporter
};
