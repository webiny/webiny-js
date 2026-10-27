import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowSettingsGateway } from "./IWorkflowSettingsGateway.js";

export const WorkflowSettingsGateway = createAbstraction<IWorkflowSettingsGateway>(
    "Workflows/WorkflowSettingsGateway"
);

export namespace WorkflowSettingsGateway {
    export type Interface = IWorkflowSettingsGateway;
}
