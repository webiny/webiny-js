import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowSettingsUseCases } from "./IWorkflowSettingsUseCases.js";

export const WorkflowSettingsUseCases = createAbstraction<IWorkflowSettingsUseCases>(
    "Workflows/WorkflowSettingsUseCases"
);

export namespace WorkflowSettingsUseCases {
    export type Interface = IWorkflowSettingsUseCases;
}
