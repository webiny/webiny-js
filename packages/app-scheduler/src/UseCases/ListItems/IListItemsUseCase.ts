import type { IListScheduleActionsExecuteParams } from "~/Gateways/index.js";

export interface IListItemsUseCase {
    execute: (params?: Omit<IListScheduleActionsExecuteParams, "app">) => Promise<void>;
}
