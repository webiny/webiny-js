import {
    FileManagerContext,
    FileManagerSystem,
    FileManagerSystemStorageOperations,
    FileManagerSystemStorageOperationsCreateParams,
    FileManagerSystemStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import {Entity, Table} from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import configurations from "~/operations/configurations";
import {getDocumentClient, getTable} from "~/operations/helpers";


interface ConstructorParams {
    context: FileManagerContext;
}

const SORT_KEY = "FM";

export class FileManagerSystemStorageOperationsDdbEs implements FileManagerSystemStorageOperations {
    private readonly _context: FileManagerContext;
    private _partitionKey: string;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;
    
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

    public constructor({context}: ConstructorParams) {
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
            }
        });
    }
    
    public async get(): Promise<FileManagerSystem | null> {
    
        const system = await this._entity.get({
            PK: this.partitionKey,
            SK: SORT_KEY,
        });
        
        return system || null;
    }
    
    public async create(params: FileManagerSystemStorageOperationsCreateParams): Promise<FileManagerSystem> {
        const {data} = params;
        try {
            await this._entity.put({
                PK: this.partitionKey,
                SK: SORT_KEY,
                ...data,
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not insert new system data into DynamoDB",
                "CREATE_SYSTEM_ERROR",
                {
                    data,
                }
            )
        }
        return data;
    }
    
    public async update(params: FileManagerSystemStorageOperationsUpdateParams): Promise<FileManagerSystem> {
        const {original, data} = params;
        
        try {
            await this._entity.update({
                PK: this.partitionKey,
                SK: SORT_KEY,
                ...data,
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not update system data in the DynamoDB.",
                "UPDATE_SYSTEM_ERROR",
                {
                    data,
                }
            )
        }
        return {
            ...original,
            ...data,
        };
    }
}