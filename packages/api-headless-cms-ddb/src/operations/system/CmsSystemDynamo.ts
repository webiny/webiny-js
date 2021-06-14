import { CmsContext, CmsSystem, CmsSystemStorageOperations } from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";
import WebinyError from "@webiny/error";
import { Entity, Table } from "dynamodb-toolbox";
import { getDocumentClient, getTable } from "../helpers";

interface ConstructorArgs {
    context: CmsContext;
}

const SYSTEM_SORT_KEY = "CMS";

export default class CmsSystemDynamo implements CmsSystemStorageOperations {
    private readonly _context: CmsContext;
    private _partitionKey: string;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        if (!this._partitionKey) {
            const tenant = this._context.security.getTenant();
            if (!tenant) {
                throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
            }
            this._partitionKey = `T#${tenant.id}#SYSTEM`;
        }
        return this._partitionKey;
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
            name: "System",
            table: this._table,
            attributes: {
                PK: {
                    partitionKey: true
                },
                SK: {
                    sortKey: true
                },
                version: {
                    type: "string"
                },
                readAPIKey: {
                    type: "string"
                }
            }
        });
    }

    public async get(): Promise<CmsSystem> {
        const response = await this._entity.get({
            PK: this.partitionKey,
            SK: SYSTEM_SORT_KEY
        });

        if (!response || !response.Item) {
            return null;
        }
        return response.Item;
    }

    public async create(data: CmsSystem): Promise<void> {
        try {
            const result = await this._entity.put({
                PK: this.partitionKey,
                SK: SYSTEM_SORT_KEY,
                ...data
            });
            if (!result) {
                throw new WebinyError(
                    "Could not create the system data - no result.",
                    "CREATE_SYSTEM_ERROR"
                );
            }
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create the system data.",
                ex.code || "CREATE_SYSTEM_ERROR",
                {
                    error: ex,
                    data
                }
            );
        }
    }

    public async update(data: CmsSystem): Promise<void> {
        try {
            const result = await this._entity.update({
                PK: this.partitionKey,
                SK: SYSTEM_SORT_KEY,
                ...data
            });
            if (!result) {
                throw new WebinyError(
                    "Could not update the system data - no result.",
                    "CREATE_SYSTEM_ERROR"
                );
            }
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update the system data.",
                ex.code || "UPDATE_SYSTEM_ERROR",
                {
                    error: ex,
                    data
                }
            );
        }
    }
}
