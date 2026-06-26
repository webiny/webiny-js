import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowState } from "~/types.js";

export interface IGetTargetWorkflowStateParams {
    app: string;
    targetRevisionId: string;
}

export interface IGetTargetWorkflowStateGateway {
    execute(params: IGetTargetWorkflowStateParams): Promise<IWorkflowState | null>;
}

export const GetTargetWorkflowStateGateway = createAbstraction<IGetTargetWorkflowStateGateway>(
    "GetTargetWorkflowStateGateway"
);

export namespace GetTargetWorkflowStateGateway {
    export type Interface = IGetTargetWorkflowStateGateway;
}

export interface IGetTargetWorkflowStateUseCase {
    execute(params: IGetTargetWorkflowStateParams): Promise<IWorkflowState | null>;
}

export const GetTargetWorkflowStateUseCase = createAbstraction<IGetTargetWorkflowStateUseCase>(
    "GetTargetWorkflowStateUseCase"
);

export namespace GetTargetWorkflowStateUseCase {
    export type Interface = IGetTargetWorkflowStateUseCase;
}
