import { createAbstraction } from "@webiny/feature/admin";
import type { SchedulerEntry } from "~/types.js";

export interface IGetScheduledActionGatewayExecuteParams {
    namespace: string;
    id: string;
}

export type IGetScheduledActionGatewayResponse = SchedulerEntry | null;

export interface IGetScheduledActionGateway {
    execute(
        params: IGetScheduledActionGatewayExecuteParams
    ): Promise<IGetScheduledActionGatewayResponse>;
}

export const GetScheduledActionGateway = createAbstraction<IGetScheduledActionGateway>(
    "Scheduler/GetScheduledActionGateway"
);

export namespace GetScheduledActionGateway {
    export type Interface = IGetScheduledActionGateway;
}
