import type { IGetScheduleActionGatewayExecuteParams } from "~/Gateways/index.js";

export interface IGetItemController {
    execute: (params: Omit<IGetScheduleActionGatewayExecuteParams, "app">) => Promise<void>;
}
