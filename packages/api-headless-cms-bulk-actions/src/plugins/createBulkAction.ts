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
    return [
        createBulkActionTasks({
            name: config.name,
            dataLoader: config.dataLoader,
            dataProcessor: config.dataProcessor
        }),
        createBulkActionGraphQL({
            name: config.name,
            excludedModels: config.excludedModels
        })
    ];
};
