import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowState } from "~/types.js";

export interface IRejectStepParams {
    id: string;
    comment: string;
}

export interface IRejectStepGateway {
    execute(params: IRejectStepParams): Promise<IWorkflowState>;
}

export const RejectStepGateway = createAbstraction<IRejectStepGateway>("RejectStepGateway");

export namespace RejectStepGateway {
    export type Interface = IRejectStepGateway;
}

export interface IRejectStepUseCase {
    execute(params: IRejectStepParams): Promise<IWorkflowState>;
}

export const RejectStepUseCase = createAbstraction<IRejectStepUseCase>("RejectStepUseCase");

export namespace RejectStepUseCase {
    export type Interface = IRejectStepUseCase;
}
