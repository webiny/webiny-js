import { get } from "@webiny/db-dynamodb/utils/get";
import { DbItem, queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import WebinyError from "@webiny/error";

import { Link, LinksStorageOperations } from "@webiny/api-folders/types";
import { Entity } from "dynamodb-toolbox";
import { DataContainer } from "~/types";

const createLinkGsiPartitionKey = ({
    tenant,
    locale,
    folderId
}: Pick<Link, "tenant" | "locale" | "folderId">) => {
    return `T#${tenant}#L#${locale}#FOLDER#${folderId}#LINKS`;
};

const createLinkKeys = ({ id, tenant, locale }: Pick<Link, "id" | "tenant" | "locale">) => {
    return {
        PK: `T#${tenant}#L#${locale}#LINK#${id}`,
        SK: `A`
    };
};

const createLinkGsiKeys = ({
    tenant,
    locale,
    folderId,
    id
}: Pick<Link, "tenant" | "locale" | "folderId" | "id">) => {
    return {
        GSI1_PK: createLinkGsiPartitionKey({ tenant, locale, folderId }),
        GSI1_SK: id
    };
};

export const createLinksStorageOperations = (entity: Entity<any>): LinksStorageOperations => {
    return {
        async createLink({ link }): Promise<Link> {
            const keys = {
                ...createLinkKeys(link),
                ...createLinkGsiKeys(link)
            };

            try {
                await entity.put({
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

        async getLink({ tenant, locale, id, folderId }): Promise<Link | undefined> {
            try {
                let result;
                if (id) {
                    result = await get<DbItem<DataContainer<Link>>>({
                        entity,
                        keys: createLinkKeys({ id, tenant, locale })
                    });
                } else if (folderId) {
                    result = await queryOne<DataContainer<Link>>({
                        entity,
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
                    entity,
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
                })
                    .map(item => item?.data)
                    .filter(Boolean);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Could not list links.",
                    code: "LIST_LINKS_ERROR"
                });
            }
        },

        async updateLink({ link }): Promise<Link> {
            try {
                await entity.put({
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
                await entity.delete(keys);
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
