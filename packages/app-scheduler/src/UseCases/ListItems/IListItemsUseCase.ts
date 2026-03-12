import type { IListScheduleActionsGatewayExecuteParams } from "~/Gateways/index.js";

export interface IListItemsUseCase {
    execute: (params?: Omit<IListScheduleActionsGatewayExecuteParams, "namespace">) => Promise<void>;
}
