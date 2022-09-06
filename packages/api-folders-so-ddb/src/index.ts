import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import WebinyError from "@webiny/error";

import { createTable } from "./definitions/table";
import { createFolderEntity, createLinkEntity } from "./definitions/entities";

import { ENTITIES, FoldersStorageParams } from "./types";
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
        folders: createFolderEntity(table, attributes ? attributes[ENTITIES.FOLDER] : {}),
        links: createLinkEntity(table, attributes ? attributes[ENTITIES.LINK] : {})
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
        GSI1_PK: `T#${tenant}#L#${locale}#FOLDER#${folderId}#LINKS`,
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

        async createLink({ link }): Promise<Link> {
            const keys = {
                ...createLinkKeys(link),
                ...createLinkGsiKeys(link)
            };

            try {
                await entities.links.put({
                    ...cleanupItem(entities.links, link),
                    TYPE: "link",
                    ...keys
                });
                return link;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not create link.",
                    code: "CREATE_LINK_ERROR",
                    data: { keys }
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
                        partitionKey: `T#${tenant}#L#${locale}#FOLDER#${folderId}#LINKS`,
                        options: {
                            index: "GSI1",
                            eq: id
                        }
                    });
                }

                return cleanupItem(entities.links, result);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not load link.",
                    code: "GET_LINK_ERROR",
                    data: { id, folderId }
                });
            }
        },

        async listLinks({ where: { tenant, locale, folderId }, sort }): Promise<Link[]> {
            let items: Link[] = [];

            try {
                items = await queryAll<Link>({
                    entity: entities.links,
                    partitionKey: `T#${tenant}#L#${locale}#FOLDER#${folderId}#LINKS`,
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list links.",
                    code: "LIST_LINKS_ERROR"
                });
            }

            return cleanupItems(
                entities.links,
                sortItems({
                    items,
                    sort,
                    fields: []
                })
            );
        },

        async updateLink({ link }): Promise<Link> {
            const keys = createLinkKeys(link);

            try {
                await entities.links.put({
                    ...cleanupItem(entities.links, link),
                    ...keys,
                    ...createLinkGsiKeys(link)
                });
                return link;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not update link.",
                    code: "UPDATE_LINK_ERROR",
                    data: { keys, link }
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
                    data: { keys, link }
                });
            }
        }
    };
};
