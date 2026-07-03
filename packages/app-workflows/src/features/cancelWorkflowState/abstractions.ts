import { createAbstraction } from "@webiny/feature/admin";

export interface ICancelWorkflowStateParams {
    id: string;
}

export interface ICancelWorkflowStateGateway {
    execute(params: ICancelWorkflowStateParams): Promise<void>;
}

export const CancelWorkflowStateGateway = createAbstraction<ICancelWorkflowStateGateway>(
    "CancelWorkflowStateGateway"
);

export namespace CancelWorkflowStateGateway {
    export type Interface = ICancelWorkflowStateGateway;
}

export interface ICancelWorkflowStateUseCase {
    execute(params: ICancelWorkflowStateParams): Promise<void>;
}

export const CancelWorkflowStateUseCase = createAbstraction<ICancelWorkflowStateUseCase>(
    "CancelWorkflowStateUseCase"
);

export namespace CancelWorkflowStateUseCase {
    export type Interface = ICancelWorkflowStateUseCase;
}
