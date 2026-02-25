import { ProjectId, Telemetry, FeatureFlags } from "@webiny/project/extensions/index.js";
import { AutoInstall } from "./extensions/index.js";

export const Project = {
    Id: ProjectId,
    Telemetry: Telemetry,
    FeatureFlags,
    AutoInstall
};
