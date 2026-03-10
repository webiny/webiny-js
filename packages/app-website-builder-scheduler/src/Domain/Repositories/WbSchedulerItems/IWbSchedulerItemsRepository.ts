import type { Meta } from "@webiny/app-utils";
import type { WbSchedulerItem } from "~/Domain/index.js";
import type {
    IWbSchedulerGetExecuteParams,
    IWbSchedulerListExecuteParams
} from "~/Gateways/index.js";

export interface IWbSchedulerItemsRepository {
    getItem(params: Omit<IWbSchedulerGetExecuteParams, "modelId">): Promise<void>;
    listItems: (params: Omit<IWbSchedulerListExecuteParams, "modelId">) => Promise<void>;
    listMoreItems: () => Promise<void>;
    scheduleCancelItem: (id: string) => Promise<void>;
    schedulePublishItem: (id: string, scheduleOn: Date) => Promise<void>;
    scheduleUnpublishItem: (id: string, scheduleOn: Date) => Promise<void>;
    getItems: () => WbSchedulerItem[];
    getMeta: () => Meta;
    getLoading: () => Record<string, any>;
}
