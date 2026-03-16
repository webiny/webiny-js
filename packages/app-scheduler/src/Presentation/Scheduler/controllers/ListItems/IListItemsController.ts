import type { IListScheduledActionsGatewayExecuteParams } from "~/Gateways/index.js";

export interface IListItemsController {
    execute: (
        params?: Omit<IListScheduledActionsGatewayExecuteParams, "namespace">
    ) => Promise<void>;
}
