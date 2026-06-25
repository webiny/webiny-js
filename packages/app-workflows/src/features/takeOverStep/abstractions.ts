import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowState } from "~/types.js";

export interface ITakeOverStepParams {
    id: string;
}

export interface ITakeOverStepGateway {
    execute(params: ITakeOverStepParams): Promise<IWorkflowState>;
}

export const TakeOverStepGateway = createAbstraction<ITakeOverStepGateway>("TakeOverStepGateway");

export namespace TakeOverStepGateway {
    export type Interface = ITakeOverStepGateway;
}

export interface ITakeOverStepUseCase {
    execute(params: ITakeOverStepParams): Promise<IWorkflowState>;
}

export const TakeOverStepUseCase = createAbstraction<ITakeOverStepUseCase>("TakeOverStepUseCase");

export namespace TakeOverStepUseCase {
    export type Interface = ITakeOverStepUseCase;
}
