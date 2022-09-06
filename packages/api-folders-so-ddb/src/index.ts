import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import WebinyError from "@webiny/error";

import { createTable } from "./definitions/table";
import { createEntryEntity, createFolderEntity } from "./definitions/entities";

import { ENTITIES, FoldersStorageParams } from "./types";
import { Entry, Folder, FoldersStorageOperations } from "@webiny/api-folders/types";

const reservedFields: string[] = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (!reservedFields.includes(name)) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createStorageOperations = (params: FoldersStorageParams): FoldersStorageOperations => {
    const { table: tableName, documentClient, attributes } = params;
    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const table = createTable({ table: tableName, documentClient });

    const entities = {
        folders: createFolderEntity(table, attributes ? attributes[ENTITIES.FOLDER] : {}),
        entries: createEntryEntity(table, attributes ? attributes[ENTITIES.ENTRY] : {})
    };

    const createFolderKeys = ({
        id,
        tenant,
        locale
    }: Pick<Folder, "id" | "tenant" | "locale">) => ({
        PK: `T#${tenant}#L#${locale}#FOLDER#${id}`,
        SK: `A`
    });

    const createFolderGsiKeys = ({
        tenant,
        locale,
        category,
        slug
    }: Pick<Folder, "tenant" | "locale" | "category" | "slug">) => ({
        GSI1_PK: `T#${tenant}#L#${locale}#CATEGORY#${category}#FOLDERS`,
        GSI1_SK: slug
    });

    const createEntryKeys = ({ id, tenant, locale }: Pick<Entry, "id" | "tenant" | "locale">) => ({
        PK: `T#${tenant}#L#${locale}#ENTRY#${id}`,
        SK: `A`
    });

    const createEntryGsiKeys = ({
        tenant,
        locale,
        folderId,
        id
    }: Pick<Entry, "tenant" | "locale" | "folderId" | "id">) => ({
        GSI1_PK: `T#${tenant}#L#${locale}#FOLDER#${folderId}#ENTRIES`,
        GSI1_SK: id
    });

    return {
        async createFolder({ folder }): Promise<Folder> {
            const keys = {
                ...createFolderKeys(folder),
                ...createFolderGsiKeys(folder)
            };

            try {
                await entities.folders.put({
                    ...cleanupItem(entities.folders, folder),
                    TYPE: "folder",
                    ...keys
                });
                return folder;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not create folder.",
                    code: "CREATE_FOLDER_ERROR",
                    data: { keys }
                });
            }
        },

        async getFolder({ tenant, locale, id, slug, category }): Promise<Folder> {
            try {
                let result;
                if (id) {
                    const response = await entities.folders.get(
                        createFolderKeys({ id, tenant, locale })
                    );
                    if (response.Item) {
                        result = response.Item;
                    }
                } else if (slug) {
                    result = await queryOne({
                        entity: entities.folders,
                        partitionKey: `T#${tenant}#L#${locale}#CATEGORY#${category}#FOLDERS`,
                        options: {
                            index: "GSI1",
                            eq: slug
                        }
                    });
                }

                return cleanupItem(entities.folders, result);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not load folder.",
                    code: "GET_FOLDER_ERROR",
                    data: { id, slug }
                });
            }
        },

        async listFolders({ where: { tenant, locale, category }, sort }): Promise<Folder[]> {
            let items: Folder[] = [];

            try {
                items = await queryAll<Folder>({
                    entity: entities.folders,
                    partitionKey: `T#${tenant}#L#${locale}#CATEGORY#${category}#FOLDERS`,
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list folders.",
                    code: "LIST_FOLDERS_ERROR"
                });
            }

            return cleanupItems(
                entities.folders,
                sortItems({
                    items,
                    sort,
                    fields: []
                })
            );
        },

        async updateFolder({ folder }): Promise<Folder> {
            const keys = createFolderKeys(folder);

            try {
                await entities.folders.put({
                    ...cleanupItem(entities.folders, folder),
                    ...keys,
                    ...createFolderGsiKeys(folder)
                });
                return folder;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not update folder.",
                    code: "UPDATE_FOLDER_ERROR",
                    data: { keys, folder }
                });
            }
        },

        async deleteFolder({ folder }) {
            const keys = createFolderKeys(folder);

            try {
                await entities.folders.delete(keys);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not delete folder.",
                    code: "DELETE_FOLDER_ERROR",
                    data: { keys, folder }
                });
            }
        },

        async createEntry({ entry }): Promise<Entry> {
            const keys = {
                ...createEntryKeys(entry),
                ...createEntryGsiKeys(entry)
            };

            try {
                await entities.entries.put({
                    ...cleanupItem(entities.entries, entry),
                    TYPE: "entry",
                    ...keys
                });
                return entry;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not create entry.",
                    code: "CREATE_ENTRY_ERROR",
                    data: { keys }
                });
            }
        },

        async getEntry({ tenant, locale, id, folderId }): Promise<Entry> {
            try {
                let result;
                if (id) {
                    const response = await entities.entries.get(
                        createEntryKeys({ id, tenant, locale })
                    );
                    if (response.Item) {
                        result = response.Item;
                    }
                } else if (folderId) {
                    result = await queryOne({
                        entity: entities.entries,
                        partitionKey: `T#${tenant}#L#${locale}#FOLDER#${folderId}#ENTRIES`,
                        options: {
                            index: "GSI1",
                            eq: id
                        }
                    });
                }

                return cleanupItem(entities.entries, result);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not load entry.",
                    code: "GET_ENTRY_ERROR",
                    data: { id, folderId }
                });
            }
        },

        async listEntries({ where: { tenant, locale, folderId }, sort }): Promise<Entry[]> {
            let items: Entry[] = [];

            try {
                items = await queryAll<Entry>({
                    entity: entities.entries,
                    partitionKey: `T#${tenant}#L#${locale}#FOLDER#${folderId}#ENTRIES`,
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list entries.",
                    code: "LIST_ENTRIES_ERROR"
                });
            }

            return cleanupItems(
                entities.entries,
                sortItems({
                    items,
                    sort,
                    fields: []
                })
            );
        },

        async updateEntry({ entry }): Promise<Entry> {
            const keys = createEntryKeys(entry);

            try {
                await entities.entries.put({
                    ...cleanupItem(entities.entries, entry),
                    ...keys,
                    ...createEntryGsiKeys(entry)
                });
                return entry;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not update entry.",
                    code: "UPDATE_ENTRY_ERROR",
                    data: { keys, entry }
                });
            }
        },

        async deleteEntry({ entry }) {
            const keys = createEntryKeys(entry);

            try {
                await entities.entries.delete(keys);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not delete entry.",
                    code: "DELETE_ENTRY_ERROR",
                    data: { keys, entry }
                });
            }
        }
    };
};
