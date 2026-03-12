import type { IListScheduleActionsGatewayExecuteParams } from "~/Gateways/index.js";

export interface IListItemsController {
    execute: (params?: Omit<IListScheduleActionsGatewayExecuteParams, "namespace">) => Promise<void>;
}
