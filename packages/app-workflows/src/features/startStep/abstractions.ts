import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowState } from "~/types.js";

export interface IStartStepParams {
    id: string;
}

export interface IStartStepGateway {
    execute(params: IStartStepParams): Promise<IWorkflowState>;
}

export const StartStepGateway = createAbstraction<IStartStepGateway>("StartStepGateway");

export namespace StartStepGateway {
    export type Interface = IStartStepGateway;
}

export interface IStartStepUseCase {
    execute(params: IStartStepParams): Promise<IWorkflowState>;
}

export const StartStepUseCase = createAbstraction<IStartStepUseCase>("StartStepUseCase");

export namespace StartStepUseCase {
    export type Interface = IStartStepUseCase;
}
