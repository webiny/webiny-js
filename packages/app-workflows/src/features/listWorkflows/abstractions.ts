import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflow } from "~/types.js";

export interface IListWorkflowsParams {
    where?: {
        app?: string;
    };
}

export interface IListWorkflowsGateway {
    execute(params?: IListWorkflowsParams): Promise<IWorkflow[]>;
}

export const ListWorkflowsGateway =
    createAbstraction<IListWorkflowsGateway>("ListWorkflowsGateway");

export namespace ListWorkflowsGateway {
    export type Interface = IListWorkflowsGateway;
}

export interface IListWorkflowsUseCase {
    execute(params?: IListWorkflowsParams): Promise<IWorkflow[]>;
}

export const ListWorkflowsUseCase =
    createAbstraction<IListWorkflowsUseCase>("ListWorkflowsUseCase");

export namespace ListWorkflowsUseCase {
    export type Interface = IListWorkflowsUseCase;
}
