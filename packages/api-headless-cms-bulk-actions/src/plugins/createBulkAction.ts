import { createBulkActionGraphQL } from "./createBulkActionGraphQL";
import { createBulkActionTasks } from "~/plugins/createBulkActionTasks";
import { IListEntries, IProcessEntry } from "~/abstractions";
import { HcmsBulkActionsContext } from "~/types";

export interface CreateBulkActionConfig {
    name: string;
    dataLoader: (context: HcmsBulkActionsContext) => IListEntries;
    dataProcessor: (context: HcmsBulkActionsContext) => IProcessEntry;
    excludedModels?: string[];
}

export const createBulkAction = (config: CreateBulkActionConfig) => {
    const actionName = config.name.charAt(0).toUpperCase() + config.name.slice(1);

    return [
        createBulkActionTasks({
            name: actionName,
            dataLoader: config.dataLoader,
            dataProcessor: config.dataProcessor
        }),
        createBulkActionGraphQL({
            name: actionName,
            excludedModels: config.excludedModels
        })
    ];
};
