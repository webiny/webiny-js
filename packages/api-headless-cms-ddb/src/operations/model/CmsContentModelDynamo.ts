import {
    CmsContentModel,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsCreateArgs,
    CmsContentModelStorageOperationsDeleteArgs,
    CmsContentModelStorageOperationsGetArgs,
    CmsContentModelStorageOperationsUpdateArgs,
    CmsContext
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import configurations from "../../configurations";
import { createBasePartitionKey } from "../../utils";
import { Entity, Table } from "dynamodb-toolbox";
import { getDocumentClient, getTable } from "../helpers";

/**
 * In some cases there are no layout, lockedFields or fields arrays when they are empty.
 * Probably due to some remove empty arrays feature in the ddb lib.
 * We need to ensure that there is always, at least, an empty array on those properties.
 */
const ensureEmptyArraysExist = (model: Partial<CmsContentModel>): CmsContentModel => {
    return {
        ...(model as CmsContentModel),
        fields: model.fields || [],
        layout: model.layout || [],
        lockedFields: model.lockedFields || []
    };
};

interface ConstructorArgs {
    context: CmsContext;
}

export default class CmsContentModelDynamo implements CmsContentModelStorageOperations {
    private readonly _context: CmsContext;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        return `${createBasePartitionKey(this.context)}#CM`;
    }

    public constructor(args: ConstructorArgs) {
        const { context } = args;
        this._context = context;
        this._table = new Table({
            name: configurations.db().table || getTable(context),
            partitionKey: "PK",
            sortKey: "SK",
            DocumentClient: getDocumentClient(context)
        });
        this._entity = new Entity({
            name: "ContentModel",
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
                name: {
                    type: "string"
                },
                modelId: {
                    type: "string"
                },
                locale: {
                    type: "string"
                },
                group: {
                    type: "map"
                },
                description: {
                    type: "string"
                },
                createdOn: {
                    type: "string"
                },
                savedOn: {
                    type: "string"
                },
                createdBy: {
                    type: "map"
                },
                fields: {
                    type: "list"
                },
                layout: {
                    type: "list"
                },
                lockedFields: {
                    type: "list"
                },
                titleFieldId: {
                    type: "string"
                }
            }
        });
    }

    public async create(
        args: CmsContentModelStorageOperationsCreateArgs
    ): Promise<CmsContentModel> {
        const { data } = args;
        try {
            await this._entity.put({
                PK: this.partitionKey,
                SK: data.modelId,
                TYPE: "cms.model",
                webinyVersion: this.context.WEBINY_VERSION,
                ...data
            });
            return data;
        } catch (ex) {
            throw new WebinyError(
                ex.message || `Could not create content model`,
                ex.code || "CREATE_CONTENT_MODEL_ERROR",
                {
                    data
                }
            );
        }
    }

    public async delete(args: CmsContentModelStorageOperationsDeleteArgs): Promise<boolean> {
        const { model } = args;
        try {
            await this._entity.delete({
                PK: this.partitionKey,
                SK: model.modelId
            });
        } catch (ex) {
            throw new WebinyError("Could not delete content model.", "DELETE_CONTENT_MODEL_ERROR", {
                model
            });
        }
        return true;
    }
    public async get(
        args: CmsContentModelStorageOperationsGetArgs
    ): Promise<CmsContentModel | null> {
        const { id } = args;
        try {
            const result = await this._entity.get({
                PK: this.partitionKey,
                SK: id
            });
            if (!result) {
                throw new WebinyError(
                    "Could not get content model - no result.",
                    "GET_CONTENT_MODEL_ERROR",
                    {
                        PK: this.partitionKey,
                        SK: id
                    }
                );
            } else if (!result.Item) {
                return null;
            }
            return ensureEmptyArraysExist(result.Item);
        } catch (ex) {
            throw new WebinyError("Could not get content model.", "GET_CONTENT_MODEL_ERROR", {
                ...ex.data,
                PK: this.partitionKey,
                SK: id
            });
        }
    }
    public async list(): Promise<CmsContentModel[]> {
        try {
            const result = await this._entity.query(this.partitionKey, {}, {});
            if (!result || !Array.isArray(result.Items)) {
                throw new WebinyError(
                    "Could not list content models - not an array.",
                    "LIST_CONTENT_MODELS_ERROR",
                    {}
                );
            }
            const items: CmsContentModel[] = result.Items;
            return items.map(ensureEmptyArraysExist);
        } catch (ex) {
            throw new WebinyError(
                "Could not list content model groups.",
                "LIST_CONTENT_MODELS_ERROR"
            );
        }
    }

    public async update(
        args: CmsContentModelStorageOperationsUpdateArgs
    ): Promise<CmsContentModel> {
        const { model, data } = args;
        const dbData = {
            PK: this.partitionKey,
            SK: model.modelId,
            TYPE: "cms.group",
            ...data,
            webinyVersion: this.context.WEBINY_VERSION
        };

        try {
            const result = await this._entity.update(dbData);
            if (!result) {
                throw new WebinyError(
                    "Could not create the content model - no result.",
                    "CREATE_CONTENT_MODEL_ERROR"
                );
            }
            return {
                ...model,
                ...data
            };
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create content model.",
                ex.code || "CREATE_CONTENT_MODEL_ERROR",
                {
                    error: ex,
                    data: dbData
                }
            );
        }
    }
}
