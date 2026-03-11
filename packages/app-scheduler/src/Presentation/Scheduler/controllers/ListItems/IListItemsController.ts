import type { IListScheduleActionsGatewayExecuteParams } from "~/Gateways/index.js";

export interface IListItemsController {
    execute: (params?: Omit<IListScheduleActionsGatewayExecuteParams, "app">) => Promise<void>;
}
