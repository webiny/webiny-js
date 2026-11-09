import { ProjectId } from "~/extensions/index.js";
import { Telemetry } from "~/extensions/index.js";
import { FeatureFlags } from "~/extensions/index.js";
import { BugReporter } from "~/extensions/index.js";
import { AutoInstall } from "~/extensions/aws/index.js";

export const Project = {
    Id: ProjectId,
    Telemetry,
    AutoInstall,
    FeatureFlags,
    BugReporter
};
