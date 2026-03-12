import type { IGetScheduleActionGatewayExecuteParams } from "~/Gateways/index.js";

export interface IGetItemUseCase {
    execute: (params: Omit<IGetScheduleActionGatewayExecuteParams, "namespace">) => Promise<void>;
}
