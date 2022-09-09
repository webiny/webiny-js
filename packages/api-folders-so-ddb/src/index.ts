import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import WebinyError from "@webiny/error";

import { createTable } from "./definitions/table";
import { createEntity } from "./definitions/entities";

import { DataContainer, ENTITIES, FoldersStorageParams } from "./types";
import { Folder, FoldersStorageOperations, Link } from "@webiny/api-folders/types";

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
        folders: createEntity(
            ENTITIES.FOLDER,
            table,
            attributes ? attributes[ENTITIES.FOLDER] : {}
        ),
        links: createEntity(ENTITIES.LINK, table, attributes ? attributes[ENTITIES.LINK] : {})
    };

    const createFolderGsiPartitionKey = ({
        tenant,
        locale,
        type
    }: Pick<Folder, "tenant" | "locale" | "type">) => `T#${tenant}#L#${locale}#FOLDERS#${type}`;

    const createFolderGsiSearchKey = ({ slug, parentId }: Pick<Folder, "slug" | "parentId">) =>
        ((!!parentId && `${parentId}#`) || "") + slug;

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
        slug,
        parentId
    }: Pick<Folder, "tenant" | "locale" | "type" | "slug" | "parentId">) => ({
        GSI1_PK: createFolderGsiPartitionKey({ tenant, locale, type }),
        GSI1_SK: createFolderGsiSearchKey({ slug, parentId })
    });

    const createLinkGsiPartitionKey = ({
        tenant,
        locale,
        folderId
    }: Pick<Link, "tenant" | "locale" | "folderId">) =>
        `T#${tenant}#L#${locale}#FOLDER#${folderId}#LINKS`;

    const createLinkKeys = ({ id, tenant, locale }: Pick<Link, "id" | "tenant" | "locale">) => ({
        PK: `T#${tenant}#L#${locale}#LINK#${id}`,
        SK: `A`
    });

    const createLinkGsiKeys = ({
        tenant,
        locale,
        folderId,
        id
    }: Pick<Link, "tenant" | "locale" | "folderId" | "id">) => ({
        GSI1_PK: createLinkGsiPartitionKey({ tenant, locale, folderId }),
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

        async getFolder({ tenant, locale, id, slug, type, parentId }): Promise<Folder> {
            try {
                let result;
                if (id) {
                    const response = await entities.folders.get(
                        createFolderKeys({ id, tenant, locale })
                    );
                    if (response.Item) {
                        result = response.Item;
                    }
                } else if (slug && type) {
                    result = await queryOne({
                        entity: entities.folders,
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
                    entity: entities.folders,
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
                }).map(item => item?.data);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list folders.",
                    code: "LIST_FOLDERS_ERROR"
                });
            }
        },

        async updateFolder({ folder }): Promise<Folder> {
            try {
                await entities.folders.put({
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
                await entities.folders.delete(keys);

                const children = await queryAll<DataContainer<Folder>>({
                    entity: entities.folders,
                    partitionKey: createFolderGsiPartitionKey({ tenant, locale, type }),
                    options: {
                        index: "GSI1",
                        beginsWith: folder.parentId
                    }
                });
                if (children.length > 0) {
                    const items = children.map(({ PK, SK }) =>
                        entities.folders.deleteBatch({
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
        },

        async createLink({ link }): Promise<Link> {
            const keys = {
                ...createLinkKeys(link),
                ...createLinkGsiKeys(link)
            };

            try {
                await entities.links.put({
                    ...keys,
                    TYPE: "link",
                    data: link
                });
                return link;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not create link.",
                    code: "CREATE_LINK_ERROR",
                    data: { link }
                });
            }
        },

        async getLink({ tenant, locale, id, folderId }): Promise<Link> {
            try {
                let result;
                if (id) {
                    const response = await entities.links.get(
                        createLinkKeys({ id, tenant, locale })
                    );
                    if (response.Item) {
                        result = response.Item;
                    }
                } else if (folderId) {
                    result = await queryOne({
                        entity: entities.links,
                        partitionKey: createLinkGsiPartitionKey({ tenant, locale, folderId }),
                        options: {
                            index: "GSI1",
                            eq: id
                        }
                    });
                }

                return result?.data;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not load link.",
                    code: "GET_LINK_ERROR",
                    data: { id, folderId }
                });
            }
        },

        async listLinks({ where: { tenant, locale, folderId }, sort }): Promise<Link[]> {
            try {
                const items = await queryAll<DataContainer<Link>>({
                    entity: entities.links,
                    partitionKey: createLinkGsiPartitionKey({ tenant, locale, folderId }),
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });

                return sortItems({
                    items,
                    sort,
                    fields: []
                }).map(item => item?.data);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list links.",
                    code: "LIST_LINKS_ERROR"
                });
            }
        },

        async updateLink({ link }): Promise<Link> {
            try {
                await entities.links.put({
                    ...createLinkKeys(link),
                    ...createLinkGsiKeys(link),
                    data: link
                });
                return link;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not update link.",
                    code: "UPDATE_LINK_ERROR",
                    data: { link }
                });
            }
        },

        async deleteLink({ link }) {
            const keys = createLinkKeys(link);

            try {
                await entities.links.delete(keys);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not delete link.",
                    code: "DELETE_LINK_ERROR",
                    data: { link }
                });
            }
        }
    };
};
