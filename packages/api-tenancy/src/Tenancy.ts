import mdbid from "mdbid";
import { TenancyContext, Tenant } from "./types";
import { TenantPlugin } from "./plugins/TenantPlugin";

const dbArgs = {
    table: process.env.DB_TABLE_SECURITY,
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] },
        { unique: true, name: "GSI1", fields: [{ name: "GSI1_PK" }, { name: "GSI1_SK" }] }
    ]
};

const tenantCache = {};

interface CreateTenantInput {
    id?: string;
    name: string;
    parent?: string | null;
}

interface UpdateTenantInput {
    name: string;
}

interface ITenancy {
    init(): Promise<void>;
    getRootTenant(): Promise<Tenant>;
    getTenant(id?: string): Promise<Tenant>;
    setTenant(tenant: Tenant): void;
    listTenants(params: { parent?: string }): Promise<Tenant[]>;
    createTenant(data: CreateTenantInput): Promise<Tenant>;
    updateTenant(id: string, data: UpdateTenantInput): Promise<boolean>;
    deleteTenant(id: string): Promise<boolean>;
}

export class Tenancy implements ITenancy {
    private _context: TenancyContext;
    private _currentTenant: Tenant;

    constructor(context: TenancyContext) {
        this._context = context;
    }

    get plugins() {
        return this._context.plugins.byType<TenantPlugin>(TenantPlugin.type);
    }

    async init() {
        await this._determineCurrentTenant();
    }

    async getRootTenant() {
        const [[tenant]] = await this._context.db.read<Tenant>({
            ...dbArgs,
            query: { PK: `T#root`, SK: "A" },
            limit: 1
        });

        if (tenant) {
            return {
                id: tenant.id,
                name: tenant.name,
                parent: tenant.parent
            };
        }

        return null;
    }

    /**
     * Get current tenant or tenant by ID
     * @param id
     */
    async getTenant(id: string = null) {
        if (!id) {
            return this._currentTenant;
        }

        const [[tenant]] = await this._context.db.read<Tenant>({
            ...dbArgs,
            query: { PK: `T#${id}`, SK: "A" }
        });

        if (tenant) {
            return {
                id: tenant.id,
                name: tenant.name,
                parent: tenant.parent
            };
        }

        return null;
    }
    setTenant(tenant: Tenant) {
        if (!this._currentTenant) {
            this._currentTenant = tenant;
        }
    }
    async listTenants({ parent }) {
        const [tenants] = await this._context.db.read<Tenant>({
            ...dbArgs,
            query: { GSI1_PK: `T#${parent}`, GSI1_SK: { $beginsWith: "T#" } },
            sort: { SK: -1 }
        });

        return tenants.map(t => ({ id: t.id, name: t.name, parent: t.parent }));
    }
    async createTenant(data) {
        const tenant = {
            ...data,
            id: data.id ?? mdbid()
        };

        await this.executeCallback<TenantPlugin["beforeCreate"]>("beforeCreate", {
            tenant,
            context: this._context
        });

        await this._context.db.create({
            ...dbArgs,
            data: {
                PK: `T#${tenant.id}`,
                SK: "A",
                TYPE: "security.tenant",
                GSI1_PK: data.parent ? `T#${data.parent}` : undefined,
                GSI1_SK: data.parent ? `T#${tenant.id}` : undefined,
                ...tenant
            }
        });

        await this.executeCallback<TenantPlugin["afterCreate"]>("afterCreate", {
            tenant,
            context: this._context
        });

        return tenant;
    }
    async updateTenant(id, data) {
        const [[tenant]] = await this._context.db.read<Tenant>({
            ...dbArgs,
            query: { PK: `T#${id}`, SK: "A" }
        });

        await this.executeCallback<TenantPlugin["beforeUpdate"]>("beforeUpdate", {
            inputData: data,
            updateData: { ...data },
            tenant,
            context: this._context
        });

        await this._context.db.update({
            ...dbArgs,
            query: { PK: `T#${id}`, SK: "A" },
            data
        });

        await this.executeCallback<TenantPlugin["afterUpdate"]>("afterUpdate", {
            inputData: data,
            tenant,
            context: this._context
        });

        return true;
    }
    async deleteTenant(id: string) {
        const [[tenant]] = await this._context.db.read<Tenant>({
            ...dbArgs,
            query: { PK: `T#${id}`, SK: "A" }
        });

        await this.executeCallback<TenantPlugin["beforeDelete"]>("beforeDelete", {
            tenant,
            context: this._context
        });

        await this._context.db.delete({
            ...dbArgs,
            query: { PK: `T#${id}`, SK: "A" }
        });

        await this.executeCallback<TenantPlugin["afterDelete"]>("afterDelete", {
            tenant,
            context: this._context
        });

        return true;
    }

    private async _determineCurrentTenant() {
        const { headers = {} } = this._context.http.request;

        const tenantId = headers["X-Tenant"] || headers["x-tenant"] || "root";

        if (!tenantCache[tenantId]) {
            tenantCache[tenantId] = await this.getTenant(tenantId);
        }

        return tenantCache[tenantId];
    }

    private async executeCallback<TCallbackFunction extends (params: any) => void | Promise<void>>(
        callback: string,
        params: Parameters<TCallbackFunction>[0]
    ) {
        for (const plugin of this.plugins) {
            if (typeof plugin[callback] === "function") {
                await plugin[callback](params);
            }
        }
    }
}
