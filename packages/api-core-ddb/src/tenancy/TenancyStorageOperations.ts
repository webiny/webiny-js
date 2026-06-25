import { TenancyStorageOperations as TenancyStorageOperationsAbstraction } from "@webiny/api-core/features/tenancy/shared/storageOperations.js";
import { DynamoDbEntityFactory, DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { WebinyError } from "@webiny/error";
import { createTenantEntity } from "~/tenancy/definitions/tenantEntity.js";
import { ENTITIES } from "~/tenancy/types.js";
import type { IEntityQueryAllParams } from "@webiny/db-dynamodb";

const setTenantDefaults = (item: TenancyStorageOperationsAbstraction.Tenant) => {
    if (!item.tags) {
        item.tags = [];
    }

    if (!item.description) {
        item.description = "";
    }

    return item;
};

class TenancyStorageOperationsImpl implements TenancyStorageOperationsAbstraction.Interface {
    private readonly client;
    private readonly entities;

    public constructor(
        private readonly tableFactory: DynamoDbTableFactory.Interface,
        private readonly entityFactory: DynamoDbEntityFactory.Interface
    ) {
        this.client = this.tableFactory.create({
            name: (process.env.DB_TABLE_TENANCY || process.env.DB_TABLE) as string
        });
        this.entities = {
            tenants: createTenantEntity({
                entityName: ENTITIES.TENANT,
                client: this.client,
                entityFactory: this.entityFactory
            })
        };
    }

    public getTable() {
        return this.client;
    }

    public getEntities() {
        return this.entities;
    }

    public async getTenantsByIds(
        ids: string[]
    ): Promise<TenancyStorageOperationsAbstraction.Tenant[]> {
        const batchReader = this.entities.tenants.createEntityReader({
            read: ids.map(id => {
                return {
                    PK: `T#${id}`,
                    SK: "A"
                };
            })
        });
        const tenants = await batchReader.execute();

        return tenants
            .map(item => {
                return item.data;
            })
            .map(item => {
                return setTenantDefaults(item);
            });
    }

    public async listTenants(
        params: TenancyStorageOperationsAbstraction.ListTenantsParams = {}
    ): Promise<TenancyStorageOperationsAbstraction.Tenant[]> {
        const { parent } = params;

        const options: IEntityQueryAllParams["options"] = {
            index: "GSI1"
        };

        if (parent) {
            options.beginsWith = `T#${parent}#`;
        } else {
            options.gt = " ";
        }

        const tenants = await this.entities.tenants.queryAll({
            partitionKey: `TENANTS`,
            options
        });

        return tenants
            .map(item => {
                return item.data;
            })
            .map(item => {
                return setTenantDefaults(item);
            });
    }

    public async createTenant(
        data: TenancyStorageOperationsAbstraction.Tenant
    ): Promise<TenancyStorageOperationsAbstraction.Tenant> {
        const keys = {
            PK: `T#${data.id}`,
            SK: "A",
            GSI1_PK: "TENANTS",
            GSI1_SK: `T#${data.parent}#${data.createdOn}`,
            GSI_TENANT: data.id
        };

        try {
            await this.entities.tenants.put({
                TYPE: "tenancy.tenant",
                ...keys,
                data
            });

            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not create tenant record.",
                code: "CREATE_TENANT_ERROR",
                data: {
                    keys,
                    data
                }
            });
        }
    }

    public async updateTenant(
        data: TenancyStorageOperationsAbstraction.Tenant
    ): Promise<TenancyStorageOperationsAbstraction.Tenant> {
        const tenantPK = `T#${data.id}`;

        const keys = {
            PK: tenantPK,
            SK: "A",
            GSI1_PK: "TENANTS",
            GSI1_SK: `T#${data.parent}#${data.createdOn}`,
            GSI_TENANT: data.id,
            TYPE: "tenancy.tenant"
        };

        try {
            await this.entities.tenants.put({
                ...keys,
                data
            });
            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update tenant record.",
                code: "CREATE_TENANT_ERROR",
                data: { keys, data }
            });
        }
    }

    public async deleteTenant(id: string): Promise<void> {
        await this.entities.tenants.delete({
            PK: `T#${id}`,
            SK: "A"
        });
    }
}

export const TenancyStorageOperations = TenancyStorageOperationsAbstraction.createImplementation({
    implementation: TenancyStorageOperationsImpl,
    dependencies: [DynamoDbTableFactory, DynamoDbEntityFactory]
});
