import { ProjectId, Telemetry } from "@webiny/project/extensions/index.js";
import { AutoInstall } from "./extensions/index.js";

export const Project = {
    Id: ProjectId.ReactComponent,
    Telemetry: Telemetry.ReactComponent,
    AutoInstall: AutoInstall.ReactComponent
};
