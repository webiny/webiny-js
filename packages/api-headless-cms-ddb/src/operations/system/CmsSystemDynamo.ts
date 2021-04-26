import { CmsContext, CmsSystem, CmsSystemStorageOperations } from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";
import WebinyError from "@webiny/error";
import { createBasePrimaryKey } from "../../utils";
import {Entity, Table} from "dynamodb-toolbox";
import {getDocumentClient} from "../documentClient";

interface ConstructorArgs {
    context: CmsContext;
}

const SYSTEM_SECONDARY_KEY = "CMS";

export default class CmsSystemDynamo implements CmsSystemStorageOperations {
    private readonly _context: CmsContext;
    private _primaryKey: string;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get context(): CmsContext {
        return this._context;
    }

    private get primaryKey(): string {
        if (!this._primaryKey) {
            this._primaryKey = `${createBasePrimaryKey(this.context)}#SYSTEM`;
        }
        return this._primaryKey;
    }

    public constructor({ context }: ConstructorArgs) {
        this._context = context;
        const documentClient = getDocumentClient(this.context);
        this._table = new Table({
            name: configurations.db().table,
            partitionKey: this.primaryKey,
            sortKey: SYSTEM_SECONDARY_KEY,
            DocumentClient: documentClient,
        });
        this._entity = new Entity({
            name: "System",
            table: this._table,
            attributes: {
                id: {
                    partitionKey: true,
                },
                sk: {
                    sortKey: true,
                },
                version: {
                    type: "string",
                },
            }
        });
    }

    public async get(): Promise<CmsSystem> {
        const response = await this._entity.get({
            id: this.primaryKey,
            sk: SYSTEM_SECONDARY_KEY,
        });
        
        if (!response || !response.Item) {
            return null;
        }
        return response.Item;
    }

    public async create(data: CmsSystem): Promise<void> {
        try {
            const result = await this._entity.put({
                id: this.primaryKey,
                sk: SYSTEM_SECONDARY_KEY,
                ...data,
            });
            if (!result) {
                throw new WebinyError(
                    "Could not create the system data - no result.",
                    "CREATE_SYSTEM_ERROR",
                )
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
        const { db } = this.context;
        try {
            const result = await this._entity.update({
                id: this.primaryKey,
                sk: SYSTEM_SECONDARY_KEY,
                ...data,
            })
            if (!result) {
                throw new WebinyError(
                    "Could not update the system data - no result.",
                    "CREATE_SYSTEM_ERROR",
                )
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
