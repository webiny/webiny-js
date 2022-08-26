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
        type,
        slug
    }: Pick<Folder, "tenant" | "locale" | "type" | "slug">) => ({
        GSI1_PK: `T#${tenant}#L#${locale}#T#${type}#FOLDERS`,
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
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create folder.",
                    code: "CREATE_FOLDER_ERROR",
                    data: { keys }
                });
            }
        },

        async getFolder({ where: { tenant, locale, id, slug, type } }): Promise<Folder> {
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
                        partitionKey: `T#${tenant}#L#${locale}#T#${type}#FOLDERS`,
                        options: {
                            index: "GSI1",
                            eq: slug
                        }
                    });
                }

                return cleanupItem(entities.folders, result);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load folder.",
                    code: "GET_FOLDER_ERROR",
                    data: { id, slug }
                });
            }
        }
    };
};
