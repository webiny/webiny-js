import type { IListScheduleActionsExecuteParams } from "~/Gateways/index.js";

export interface IListItemsController {
    execute: (params?: Omit<IListScheduleActionsExecuteParams, "app">) => Promise<void>;
}
