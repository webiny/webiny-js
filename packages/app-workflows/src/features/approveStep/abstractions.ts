import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowState } from "~/types.js";

export interface IApproveStepParams {
    id: string;
    comment?: string;
}

export interface IApproveStepGateway {
    execute(params: IApproveStepParams): Promise<IWorkflowState>;
}

export const ApproveStepGateway = createAbstraction<IApproveStepGateway>("ApproveStepGateway");

export namespace ApproveStepGateway {
    export type Interface = IApproveStepGateway;
}

export interface IApproveStepUseCase {
    execute(params: IApproveStepParams): Promise<IWorkflowState>;
}

export const ApproveStepUseCase = createAbstraction<IApproveStepUseCase>("ApproveStepUseCase");

export namespace ApproveStepUseCase {
    export type Interface = IApproveStepUseCase;
}
