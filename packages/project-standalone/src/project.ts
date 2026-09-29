import { ProjectId } from "@webiny/project/extensions/index.js";
import { Telemetry } from "@webiny/project/extensions/index.js";
import { FeatureFlags } from "@webiny/project/extensions/index.js";
import { BugReporter } from "@webiny/project/extensions/index.js";

/*
 * Mirrors the AWS namespace minus `AutoInstall`, which has no meaning without a deploy. The bug
 * reporter ships in every project regardless of hosting type, so it belongs in both.
 */
export const Project = {
    Id: ProjectId,
    Telemetry,
    FeatureFlags,
    BugReporter
};
