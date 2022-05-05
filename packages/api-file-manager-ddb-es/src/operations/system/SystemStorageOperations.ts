import {
    FileManagerSystem,
    FileManagerSystemStorageOperations,
    FileManagerSystemStorageOperationsCreateParams,
    FileManagerSystemStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import { Entity } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineSystemEntity from "~/definitions/systemEntity";
import defineTable from "~/definitions/table";
import { FileManagerContext } from "~/types";

interface SystemStorageOperationsConstructorParams {
    context: FileManagerContext;
}

const SORT_KEY = "FM";

export class SystemStorageOperations implements FileManagerSystemStorageOperations {
    private readonly _context: FileManagerContext;
    private readonly _entity: Entity<any>;

    private get partitionKey(): string {
        const tenant = this._context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
        }
        return `T#${tenant.id}#SYSTEM`;
    }

    public constructor({ context }: SystemStorageOperationsConstructorParams) {
        this._context = context;
        const table = defineTable({
            context
        });

        this._entity = defineSystemEntity({
            context,
            table
        });
    }

    public async get(): Promise<FileManagerSystem | null> {
        try {
            const system = await this._entity.get({
                PK: this.partitionKey,
                SK: SORT_KEY
            });
            if (!system || !system.Item) {
                return null;
            }
            return system.Item;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch the FileManager system.",
                ex.code || "GET_SYSTEM_ERROR"
            );
        }
    }

    public async create(
        params: FileManagerSystemStorageOperationsCreateParams
    ): Promise<FileManagerSystem> {
        const { data } = params;
        try {
            await this._entity.put({
                PK: this.partitionKey,
                SK: SORT_KEY,
                ...data
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not insert new system data into DynamoDB",
                "CREATE_SYSTEM_ERROR",
                {
                    data
                }
            );
        }
        return data;
    }

    public async update(
        params: FileManagerSystemStorageOperationsUpdateParams
    ): Promise<FileManagerSystem> {
        const { original, data } = params;

        try {
            await this._entity.update({
                PK: this.partitionKey,
                SK: SORT_KEY,
                ...data
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not update system data in the DynamoDB.",
                "UPDATE_SYSTEM_ERROR",
                {
                    data
                }
            );
        }
        return {
            ...original,
            ...data
        };
    }
}
