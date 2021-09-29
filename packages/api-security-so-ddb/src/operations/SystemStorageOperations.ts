// @ts-nocheck
import { Entity, Table } from "dynamodb-toolbox";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import Error from "@webiny/error";
import {
    System,
    SystemStorageOperations,
    SystemStorageOperationsCreateParams,
    SystemStorageOperationsUpdateParams
} from "@webiny/api-security/types";
import { createTable } from "~/definitions/table";
import { createSystemEntity } from "~/definitions/systemEntity";

import { SecurityStorageParams } from "~/types";

export class SystemStorageOperationsDdb implements SystemStorageOperations {
    protected readonly tenant: string;
    protected readonly table: Table;
    protected readonly entity: Entity<any>;

    public constructor({ tenant, plugins, table, documentClient }: SecurityStorageParams) {
        this.tenant = tenant;
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
            throw new Error(ex.message || "Could not load system.", ex.code || "GET_SYSTEM_ERROR", {
                keys
            });
        }
    }

    public async create(params: SystemStorageOperationsCreateParams): Promise<System> {
        const { system } = params;
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey()
        };
        try {
            await this.entity.put({
                ...keys,
                ...system
            });
            return system;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not create system.",
                ex.code || "CREATE_SYSTEM_ERROR",
                {
                    keys,
                    system
                }
            );
        }
    }

    public async update(params: SystemStorageOperationsUpdateParams): Promise<System> {
        const { original, system } = params;
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey()
        };
        try {
            await this.entity.put({
                ...keys,
                ...system
            });
            return system;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not update system.",
                ex.code || "UPDATE_SYSTEM_ERROR",
                {
                    keys,
                    system,
                    original
                }
            );
        }
    }

    private createPartitionKey() {
        return `T#${this.tenant}#SYSTEM`;
    }

    private createSortKey(): string {
        return "SECURITY";
    }
}
