import { createAbstraction } from "@webiny/feature/admin";

export interface ICancelScheduledActionGatewayParams {
    namespace: string;
    id: string;
}

export interface ICancelScheduledActionGateway {
    execute(params: ICancelScheduledActionGatewayParams): Promise<void>;
}

export const CancelScheduledActionGateway = createAbstraction<ICancelScheduledActionGateway>(
    "Scheduler/CancelScheduledActionGateway"
);

export namespace CancelScheduledActionGateway {
    export type Interface = ICancelScheduledActionGateway;
}
