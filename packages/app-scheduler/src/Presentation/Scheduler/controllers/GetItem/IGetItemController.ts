import type { IGetScheduledActionGatewayExecuteParams } from "~/Gateways/index.js";

export interface IGetItemController {
    execute: (params: Omit<IGetScheduledActionGatewayExecuteParams, "namespace">) => Promise<void>;
}
