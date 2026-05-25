import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { PluginsContainer } from "@webiny/plugins/types.js";
import type { KnexInstance } from "~/schema/KnexInstance.js";
import type { TableNameResolver } from "~/schema/TableNameResolver.js";

interface CreateEntriesStorageOperationsParams {
    knex: KnexInstance.Interface;
    tableNameResolver: TableNameResolver.Interface;
    plugins: PluginsContainer;
}

export const createEntriesStorageOperations = (
    _params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    return {
        getByIds: async () => {
            throw new Error("Not implemented.");
        },
        getPublishedByIds: async () => {
            throw new Error("Not implemented.");
        },
        getLatestByIds: async () => {
            throw new Error("Not implemented.");
        },
        getRevisions: async () => {
            throw new Error("Not implemented.");
        },
        getRevisionById: async () => {
            throw new Error("Not implemented.");
        },
        getPublishedRevisionByEntryId: async () => {
            throw new Error("Not implemented.");
        },
        getLatestRevisionByEntryId: async () => {
            throw new Error("Not implemented.");
        },
        getPreviousRevision: async () => {
            throw new Error("Not implemented.");
        },
        get: async () => {
            throw new Error("Not implemented.");
        },
        list: async () => {
            throw new Error("Not implemented.");
        },
        create: async () => {
            throw new Error("Not implemented.");
        },
        createRevisionFrom: async () => {
            throw new Error("Not implemented.");
        },
        update: async () => {
            throw new Error("Not implemented.");
        },
        move: async () => {
            throw new Error("Not implemented.");
        },
        deleteRevision: async () => {
            throw new Error("Not implemented.");
        },
        delete: async () => {
            throw new Error("Not implemented.");
        },
        moveToBin: async () => {
            throw new Error("Not implemented.");
        },
        restoreFromBin: async () => {
            throw new Error("Not implemented.");
        },
        deleteMultipleEntries: async () => {
            throw new Error("Not implemented.");
        },
        publish: async () => {
            throw new Error("Not implemented.");
        },
        unpublish: async () => {
            throw new Error("Not implemented.");
        },
        getUniqueFieldValues: async () => {
            throw new Error("Not implemented.");
        }
    };
};
