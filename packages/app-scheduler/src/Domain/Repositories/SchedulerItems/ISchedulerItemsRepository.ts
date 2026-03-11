import type { Meta } from "@webiny/app-utils";
import type { SchedulerItem } from "~/Domain/index.js";
import type { IGetScheduleActionExecuteParams, IListScheduleActionsExecuteParams } from "~/Gateways/index.js";

export interface ISchedulerItemsRepository {
    getItem(params: Omit<IGetScheduleActionExecuteParams, "app">): Promise<void>;
    listItems: (params?: Omit<IListScheduleActionsExecuteParams, "app">) => Promise<void>;
    listMoreItems: () => Promise<void>;
    scheduleCancelItem: (id: string) => Promise<void>;
    schedulePublishItem: (id: string, scheduleOn: Date) => Promise<void>;
    scheduleUnpublishItem: (id: string, scheduleOn: Date) => Promise<void>;
    getItems: () => SchedulerItem[];
    getMeta: () => Meta;
    getLoading: () => Record<string, any>;
}
