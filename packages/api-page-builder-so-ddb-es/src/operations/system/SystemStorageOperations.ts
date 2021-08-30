import {
    PbContext,
    System,
    SystemStorageOperations,
    SystemStorageOperationsCreateParams,
    SystemStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";
import { defineSystemEntity } from "~/definitions/systemEntity";
import { defineTable } from "~/definitions/table";

export interface Params {
    context: PbContext;
}

export class SystemStorageOperationsDdbEs implements SystemStorageOperations {
    protected readonly context: PbContext;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineSystemEntity({
            context,
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
            throw new WebinyError(
                ex.message || "Could not load system record.",
                ex.code || "SYSTEM_GET_ERROR",
                {
                    keys
                }
            );
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
                ...system,
                ...keys
            });
            return system;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create system record.",
                ex.code || "SYSTEM_CREATE_ERROR",
                {
                    system,
                    keys
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
                ...system,
                ...keys
            });
            return system;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update system record.",
                ex.code || "SYSTEM_UPDATE_ERROR",
                {
                    original,
                    system,
                    keys
                }
            );
        }
    }

    protected createPartitionKey(): string {
        return `T#${this.context.tenancy.getCurrentTenant().id}#SYSTEM`;
    }

    protected createSortKey(): string {
        return "PB";
    }
}
