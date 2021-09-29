// @ts-nocheck
import { Entity, Table } from "dynamodb-toolbox";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import Error from "@webiny/error";
import {
    CreateTenantLinkParams,
    DeleteTenantLinkParams,
    GetTenantLinkByIdentityParams,
    IdentityStorageOperations,
    ListTenantLinksByIdentityParams,
    ListTenantLinksByTypeParams,
    ListTenantLinksParams,
    TenantLink,
    UpdateTenantLinkParams
} from "@webiny/api-security/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { createTable } from "~/definitions/table";
import { createLinkEntity } from "~/definitions/linkEntity";
import { SecurityStorageParams } from "~/types";

export class IdentityStorageDdb implements IdentityStorageOperations {
    protected readonly tenant: string;
    protected readonly table: Table;
    protected readonly entity: Entity<any>;

    public constructor({ tenant, plugins, table, documentClient }: SecurityStorageParams) {
        this.tenant = tenant;
        this.table = createTable({ table, documentClient });

        this.entity = createLinkEntity({
            plugins,
            table: this.table
        });
    }

    public async getTenantLinkByIdentity({ tenant, identity }: GetTenantLinkByIdentityParams) {
        try {
            const result = await this.entity.query(`IDENTITY#${identity}`, {
                beginsWith: `LINK#T#${tenant}#`,
                limit: 1
            });

            if (!result || !result.Items) {
                return null;
            }
            return cleanupItem(this.entity, result.Items[0]);
        } catch (ex) {
            throw new Error(
                ex.message || "Could not get tenant link for identity.",
                ex.code || "GET_TENANT_LINK_BY_IDENTITY",
                { tenant, identity }
            );
        }
    }

    public async createTenantLinks(params: CreateTenantLinkParams[]) {
        const items = params.map(link => {
            return this.entity.putBatch({
                PK: `IDENTITY#${link.identity}`,
                SK: `LINK#T#${link.tenant}`,
                GSI1_PK: `T#${link.tenant}`,
                GSI1_SK: `TYPE#${link.type}#IDENTITY#${link.identity}`,
                ...link
            });
        });

        await batchWriteAll({ table: this.table, items });
    }

    public async updateTenantLinks(params: UpdateTenantLinkParams[]): Promise<void> {
        const items = params.map(link => {
            return this.entity.putBatch({
                PK: `IDENTITY#${link.identity}`,
                SK: `LINK#T#${link.tenant}`,
                GSI1_PK: `T#${link.tenant}`,
                GSI1_SK: `TYPE#${link.type}#IDENTITY#${link.identity}`,
                ...link
            });
        });

        await batchWriteAll({ table: this.table, items });
    }

    public async deleteTenantLinks(params: DeleteTenantLinkParams[]): Promise<void> {
        const items = params.map(link => {
            return this.entity.deleteBatch({
                PK: `IDENTITY#${link.identity}`,
                SK: `LINK#T#${link.tenant}`
            });
        });

        await batchWriteAll({ table: this.table, items });
    }

    public async listTenantLinksByTenant({ tenant }: ListTenantLinksParams): Promise<TenantLink[]> {
        const links = await queryAll<TenantLink>({
            entity: this.entity,
            partitionKey: `T#${tenant}`,
            options: { index: "GSI1", beginsWith: "" }
        });

        return cleanupItems(this.entity, links);
    }

    public async listTenantLinksByType<TLink = TenantLink>(
        params: ListTenantLinksByTypeParams
    ): Promise<TLink[]> {
        const { tenant, type } = params;

        const links = await queryAll<TLink>({
            entity: this.entity,
            partitionKey: `T#${tenant}`,
            options: { index: "GSI1", beginsWith: `TYPE#${type}#` }
        });

        return cleanupItems(this.entity, links);
    }

    public async listTenantLinksByIdentity(
        params: ListTenantLinksByIdentityParams
    ): Promise<TenantLink[]> {
        const { identity } = params;

        const links = await queryAll<TenantLink>({
            entity: this.entity,
            partitionKey: `IDENTITY#${identity}`,
            options: { beginsWith: `LINK#` }
        });

        return cleanupItems(this.entity, links);
    }
}
