import {
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsCreateParams,
    CmsContentModelGroupStorageOperationsDeleteParams,
    CmsContentModelGroupStorageOperationsGetParams,
    CmsContentModelGroupStorageOperationsListParams,
    CmsContentModelGroupStorageOperationsUpdateParams,
    CmsContext
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import configurations from "../../configurations";
import { createBasePartitionKey } from "../../utils";
import { Entity, Table } from "dynamodb-toolbox";
import { getDocumentClient, getTable, whereFilterFactory } from "../helpers";

interface ConstructorArgs {
    context: CmsContext;
}

export default class CmsContentModelGroupDynamo implements CmsContentModelGroupStorageOperations {
    private readonly _context: CmsContext;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        return `${createBasePartitionKey(this.context)}#CMG`;
    }

    public constructor({ context }: ConstructorArgs) {
        this._context = context;
        this._table = new Table({
            name: configurations.db().table || getTable(context),
            partitionKey: "PK",
            sortKey: "SK",
            DocumentClient: getDocumentClient(context)
        });
        this._entity = new Entity({
            name: "ContentModelGroup",
            table: this._table,
            attributes: {
                PK: {
                    partitionKey: true
                },
                SK: {
                    sortKey: true
                },
                TYPE: {
                    type: "string"
                },
                webinyVersion: {
                    type: "string"
                },
                id: {
                    type: "string"
                },
                name: {
                    type: "string"
                },
                slug: {
                    type: "string"
                },
                locale: {
                    type: "string"
                },
                description: {
                    type: "string"
                },
                icon: {
                    type: "string"
                },
                createdBy: {
                    type: "map"
                },
                createdOn: {
                    type: "string"
                },
                savedOn: {
                    type: "string"
                }
            }
        });
    }

    public async create({ data }: CmsContentModelGroupStorageOperationsCreateParams) {
        const dbData = {
            PK: this.partitionKey,
            SK: data.id,
            TYPE: "cms.group",
            ...data,
            webinyVersion: this.context.WEBINY_VERSION
        };

        try {
            const result = await this._entity.put(dbData);
            if (!result) {
                throw new WebinyError(
                    "Could not create the content model group - no result.",
                    "CREATE_CONTENT_MODEL_GROUP_ERROR"
                );
            }
            return dbData;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create content model group.",
                ex.code || "CREATE_CONTENT_MODEL_GROUP_ERROR",
                {
                    error: ex,
                    data: dbData
                }
            );
        }
    }
    public async delete({ group }: CmsContentModelGroupStorageOperationsDeleteParams) {
        const { id } = group;
        try {
            const result = await this._entity.delete({
                PK: this.partitionKey,
                SK: id
            });
            if (!result) {
                throw new WebinyError(
                    "Could not delete content model group - no result.",
                    "DELETE_CONTENT_MODEL_GROUP_ERROR",
                    {
                        id
                    }
                );
            }
        } catch (ex) {
            throw new WebinyError(
                "Could not delete content model group.",
                "DELETE_CONTENT_MODEL_GROUP_ERROR",
                {
                    id
                }
            );
        }
        return true;
    }
    public async get({ id }: CmsContentModelGroupStorageOperationsGetParams) {
        const response = await this._entity.get({
            PK: this.partitionKey,
            SK: id
        });

        if (!response || !response.Item) {
            return null;
        }
        return response.Item;
    }
    public async list({ where, limit }: CmsContentModelGroupStorageOperationsListParams) {
        let groups;
        try {
            const result = await this._entity.query(
                this.partitionKey,
                {
                    limit
                },
                {}
            );
            if (!result || !Array.isArray(result.Items)) {
                throw new WebinyError(
                    "Could not list content model groups - not an array.",
                    "LIST_CONTENT_MODEL_GROUP_ERROR",
                    {
                        where,
                        limit
                    }
                );
            }
            groups = result.Items;
        } catch (ex) {
            throw new WebinyError(
                "Could not list content model groups.",
                "LIST_CONTENT_MODEL_GROUP_ERROR",
                {
                    where,
                    limit
                }
            );
        }

        const whereKeys = Object.keys(where || {});
        if (whereKeys.length === 0) {
            return groups;
        }

        return groups.filter(whereFilterFactory(where));
    }

    public async update({ group, data }: CmsContentModelGroupStorageOperationsUpdateParams) {
        const dbData = {
            PK: this.partitionKey,
            SK: group.id,
            TYPE: "cms.group",
            ...data,
            webinyVersion: this.context.WEBINY_VERSION
        };

        try {
            const result = await this._entity.update(dbData);
            if (!result) {
                throw new WebinyError(
                    "Could not create the content model group - no result.",
                    "CREATE_CONTENT_MODEL_GROUP_ERROR"
                );
            }
            return {
                ...group,
                ...data
            };
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create content model group.",
                ex.code || "CREATE_CONTENT_MODEL_GROUP_ERROR",
                {
                    error: ex,
                    data: dbData
                }
            );
        }
    }
}
