import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflow } from "~/types.js";

export interface IStoreWorkflowGateway {
    execute(workflow: IWorkflow): Promise<IWorkflow>;
}

export const StoreWorkflowGateway =
    createAbstraction<IStoreWorkflowGateway>("StoreWorkflowGateway");

export namespace StoreWorkflowGateway {
    export type Interface = IStoreWorkflowGateway;
}

export interface IStoreWorkflowUseCase {
    execute(workflow: IWorkflow): Promise<IWorkflow>;
}

export const StoreWorkflowUseCase =
    createAbstraction<IStoreWorkflowUseCase>("StoreWorkflowUseCase");

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
}
