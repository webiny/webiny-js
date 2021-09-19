import { Entity, Table } from "dynamodb-toolbox";
import { System, SystemStorageOperations } from "@webiny/api-tenancy/types";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import Error from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createSystemEntity } from "~/definitions/systemEntity";
import { SystemStorageParams } from "~/types";

export class SystemStorageOperationsDdb implements SystemStorageOperations {
    protected readonly tenant: string;
    protected readonly table: Table;
    protected readonly entity: Entity<any>;

    public constructor({ plugins, table, documentClient }: SystemStorageParams) {
        this.table = createTable({ table, documentClient });

        this.entity = createSystemEntity({
            plugins,
            table: this.table
        });
    }

    public async get(): Promise<System> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey()
        };
        try {
            const result = await this.entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(this.entity, result.Item);
        } catch (ex) {
            throw new Error(
                ex.message || "Could not load system record.",
                ex.code || "GET_SYSTEM_ERROR",
                {
                    keys
                }
            );
        }
    }

    public async create(data: System): Promise<System> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey()
        };
        try {
            await this.entity.put({
                ...keys,
                ...data
            });
            return data;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not create system record.",
                ex.code || "CREATE_SYSTEM_ERROR",
                { keys, data }
            );
        }
    }

    public async update(data: System): Promise<System> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey()
        };
        try {
            await this.entity.put({
                ...keys,
                ...data
            });
            return data;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not update system record.",
                ex.code || "UPDATE_SYSTEM_ERROR",
                { keys, data }
            );
        }
    }

    private createPartitionKey() {
        return "T#root#SYSTEM";
    }

    private createSortKey(): string {
        return "TENANCY";
    }
}
