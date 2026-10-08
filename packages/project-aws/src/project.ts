import { ProjectId } from "@webiny/project/extensions/index.js";
import { Telemetry } from "@webiny/project/extensions/index.js";
import { FeatureFlags } from "@webiny/project/extensions/index.js";
import { BugReporter } from "@webiny/project/extensions/index.js";
import { AutoInstall } from "./extensions/index.js";

export const Project = {
    Id: ProjectId,
    Telemetry,
    AutoInstall,
    FeatureFlags,
    BugReporter
};
