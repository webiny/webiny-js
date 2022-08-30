import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryOne } from "@webiny/db-dynamodb/utils/query";
import WebinyError from "@webiny/error";

import { createTable } from "./definitions/table";
import { createFolderEntity } from "./definitions/entities";

import { ENTITIES, FoldersStorageParams } from "./types";
import { Folder, FoldersStorageOperations } from "@webiny/api-folders/types";

const reservedFields: string[] = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
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
        folders: createFolderEntity(table, attributes ? attributes[ENTITIES.FOLDER] : {})
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
        GSI1_PK: `T#${tenant}#L#${locale}#category#${category}#FOLDERS`,
        GSI1_SK: slug
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

        async getFolder({ where: { tenant, locale, id, slug, category } }): Promise<Folder> {
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
                        partitionKey: `T#${tenant}#L#${locale}#category#${category}#FOLDERS`,
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
        }
    };
};
