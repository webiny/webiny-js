import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowConfigGateway } from "./IWorkflowConfigGateway.js";

export const WorkflowConfigGateway = createAbstraction<IWorkflowConfigGateway>(
    "Workflows/WorkflowConfigGateway"
);

export namespace WorkflowConfigGateway {
    export type Interface = IWorkflowConfigGateway;
}
