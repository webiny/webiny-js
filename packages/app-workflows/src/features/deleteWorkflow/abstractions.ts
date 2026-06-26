import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflow } from "~/types.js";

export interface IDeleteWorkflowGateway {
    execute(workflow: IWorkflow): Promise<void>;
}

export const DeleteWorkflowGateway =
    createAbstraction<IDeleteWorkflowGateway>("DeleteWorkflowGateway");

export namespace DeleteWorkflowGateway {
    export type Interface = IDeleteWorkflowGateway;
}

export interface IDeleteWorkflowUseCase {
    execute(workflow: IWorkflow): Promise<void>;
}

export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
}
