import type { IListScheduledActionsGatewayExecuteParams } from "~/Gateways/index.js";

export interface IListItemsUseCase {
    execute: (
        params?: Omit<IListScheduledActionsGatewayExecuteParams, "namespace">
    ) => Promise<void>;
}
