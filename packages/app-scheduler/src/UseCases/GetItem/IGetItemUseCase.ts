import type { IGetScheduledActionGatewayExecuteParams } from "~/Gateways/index.js";

export interface IGetItemUseCase {
    execute: (params: Omit<IGetScheduledActionGatewayExecuteParams, "namespace">) => Promise<void>;
}
