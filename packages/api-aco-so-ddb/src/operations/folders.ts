import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { get } from "@webiny/db-dynamodb/utils/get";
import { DbItem, queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import WebinyError from "@webiny/error";

import { Entity, Table } from "dynamodb-toolbox";
import { Folder, FoldersStorageOperations } from "@webiny/api-aco/types";
import { DataContainer } from "~/types";

const createFolderGsiPartitionKey = ({
    tenant,
    locale,
    type
}: Pick<Folder, "tenant" | "locale" | "type">) => {
    return `T#${tenant}#L#${locale}#FOLDERS#${type}`;
};

const createFolderGsiSearchKey = ({ slug, parentId }: Pick<Folder, "slug" | "parentId">) => {
    return [parentId, slug].filter(Boolean).join("#");
};

const createFolderKeys = ({ id, tenant, locale }: Pick<Folder, "id" | "tenant" | "locale">) => {
    return {
        PK: `T#${tenant}#L#${locale}#FOLDER#${id}`,
        SK: `A`
    };
};

const createFolderGsiKeys = ({
    tenant,
    locale,
    type,
    slug,
    parentId
}: Pick<Folder, "tenant" | "locale" | "type" | "slug" | "parentId">) => {
    return {
        GSI1_PK: createFolderGsiPartitionKey({ tenant, locale, type }),
        GSI1_SK: createFolderGsiSearchKey({ slug, parentId })
    };
};

export const createFoldersStorageOperations = (
    entity: Entity<any>,
    table: Table
): FoldersStorageOperations => {
    return {
        async createFolder({ folder }): Promise<Folder> {
            const keys = {
                ...createFolderKeys(folder),
                ...createFolderGsiKeys(folder)
            };

            try {
                await entity.put({
                    ...keys,
                    TYPE: "folder",
                    data: folder
                });
                return folder;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not create folder.",
                    code: "CREATE_FOLDER_ERROR",
                    data: { folder }
                });
            }
        },

        async getFolder({ tenant, locale, id, slug, type, parentId }): Promise<Folder | undefined> {
            try {
                let result;
                if (id) {
                    result = await get<DbItem<DataContainer<Folder>>>({
                        entity,
                        keys: createFolderKeys({ id, tenant, locale })
                    });
                } else if (slug && type) {
                    result = await queryOne<DataContainer<Folder>>({
                        entity,
                        partitionKey: createFolderGsiPartitionKey({ tenant, locale, type }),
                        options: {
                            index: "GSI1",
                            eq: createFolderGsiSearchKey({ slug, parentId })
                        }
                    });
                }

                return result?.data;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not load folder.",
                    code: "GET_FOLDER_ERROR",
                    data: { id, slug }
                });
            }
        },

        async listFolders({ where: { tenant, locale, type }, sort }): Promise<Folder[]> {
            try {
                const items = await queryAll<DataContainer<Folder>>({
                    entity,
                    partitionKey: createFolderGsiPartitionKey({ tenant, locale, type }),
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });

                return sortItems({
                    items,
                    sort,
                    fields: []
                })
                    .map(item => item?.data)
                    .filter(Boolean);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list folders.",
                    code: "LIST_FOLDERS_ERROR"
                });
            }
        },

        async updateFolder({ folder }): Promise<Folder> {
            try {
                await entity.put({
                    ...createFolderKeys(folder),
                    ...createFolderGsiKeys(folder),
                    data: folder
                });
                return folder;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not update folder.",
                    code: "UPDATE_FOLDER_ERROR",
                    data: { folder }
                });
            }
        },

        async deleteFolder({ folder }) {
            const keys = createFolderKeys(folder);

            try {
                const { tenant, locale, type } = folder;
                await entity.delete(keys);

                const children = await queryAll<DataContainer<Folder>>({
                    entity,
                    partitionKey: createFolderGsiPartitionKey({ tenant, locale, type }),
                    options: {
                        index: "GSI1",
                        beginsWith: `${folder.id}#`
                    }
                });
                if (children.length > 0) {
                    const items = children.map(({ PK, SK }) =>
                        entity.deleteBatch({
                            PK,
                            SK
                        })
                    );

                    await batchWriteAll({
                        table,
                        items
                    });
                }
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
