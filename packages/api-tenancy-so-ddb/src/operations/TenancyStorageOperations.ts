import { Entity, Table } from "dynamodb-toolbox";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import Error from "@webiny/error";
import { Tenant, TenantsStorageOperations } from "@webiny/api-tenancy/types";
import { createTable } from "~/definitions/table";
import { createTenantEntity } from "~/definitions/tenantEntity";

import { TenancyStorageParams } from "~/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";

export class TenantsStorageOperationsDdb implements TenantsStorageOperations {
    protected readonly tenant: string;
    protected readonly table: Table;
    protected readonly entity: Entity<any>;

    public constructor({ plugins, table, documentClient }: TenancyStorageParams) {
        this.table = createTable({ table, documentClient });

        this.entity = createTenantEntity({
            plugins,
            table: this.table
        });
    }

    async getTenantsByIds<TTenant extends Tenant = Tenant>(ids: string[]): Promise<TTenant[]> {
        const items = ids.map(id => this.entity.getBatch({ PK: `T#${id}`, SK: "A" }));

        const tenants = await batchReadAll<TTenant>({ table: this.table, items });

        return cleanupItems(this.entity, tenants);
    }

    async listTenants<TTenant extends Tenant = Tenant>({
        parent
    }: {
        parent: any;
    }): Promise<TTenant[]> {
        const tenants = await queryAll<TTenant>({
            entity: this.entity,
            partitionKey: `T#${parent}`,
            options: {
                index: "GSI1",
                beginsWith: "T#"
            }
        });

        return cleanupItems(this.entity, tenants);
    }

    async createTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant> {
        const keys = {
            PK: `T#${data.id}`,
            SK: "A",
            GSI1_PK: data.parent ? `T#${data.parent}` : undefined,
            GSI1_SK: data.parent ? `T#${data.id}` : undefined
        };
        try {
            await this.entity.put({
                ...keys,
                ...data
            });
            return data as TTenant;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not create tenant record.",
                ex.code || "CREATE_TENANT_ERROR",
                { keys, data }
            );
        }
    }

    async updateTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant> {
        const keys = {
            PK: `T#${data.id}`,
            SK: "A",
            GSI1_PK: data.parent ? `T#${data.parent}` : undefined,
            GSI1_SK: data.parent ? `T#${data.id}` : undefined
        };
        try {
            await this.entity.update({
                ...keys,
                ...data
            });
            return data as TTenant;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not update tenant record.",
                ex.code || "CREATE_TENANT_ERROR",
                { keys, data }
            );
        }
    }

    async deleteTenant(id: string): Promise<void> {
        await this.entity.delete({
            PK: `T#${id}`,
            SK: "A"
        });
    }
}
