import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowConfigUseCases } from "./IWorkflowConfigUseCases.js";

export const WorkflowConfigUseCases = createAbstraction<IWorkflowConfigUseCases>(
    "Workflows/WorkflowConfigUseCases"
);

export namespace WorkflowConfigUseCases {
    export type Interface = IWorkflowConfigUseCases;
}
