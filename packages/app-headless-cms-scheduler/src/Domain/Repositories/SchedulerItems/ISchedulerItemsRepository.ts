import { Meta } from "@webiny/app-utils";
import { SchedulerItem } from "~/Domain";
import type { ISchedulerGetExecuteParams, ISchedulerListExecuteParams } from "~/Gateways/index.js";

export interface ISchedulerItemsRepository {
    getItem(params: Omit<ISchedulerGetExecuteParams, "modelId">): Promise<void>;
    listItems: (params: Omit<ISchedulerListExecuteParams, "modelId">) => Promise<void>;
    listMoreItems: () => Promise<void>;
    scheduleCancelItem: (id: string) => Promise<void>;
    schedulePublishItem: (id: string, scheduleOn: Date) => Promise<void>;
    scheduleUnpublishItem: (id: string, scheduleOn: Date) => Promise<void>;
    getItems: () => SchedulerItem[];
    getMeta: () => Meta;
    getLoading: () => Record<string, any>;
}
