import mdbid from "mdbid";
import { TenancyContext, Tenant } from "./types";
import { TenantPlugin } from "./plugins/TenantPlugin";
import { TenancyLoaders } from "./TenancyLoaders";
import { dbArgs } from "./dbArgs";

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
    getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant;
    getTenantById<TTenant extends Tenant = Tenant>(id: string): Promise<TTenant>;
    setCurrentTenant(tenant: Tenant): void;
    listTenants<TTenant extends Tenant = Tenant>(params: { parent: string }): Promise<TTenant[]>;
    createTenant<TTenant extends Tenant = Tenant>(data: CreateTenantInput): Promise<TTenant>;
    updateTenant(id: string, data: UpdateTenantInput): Promise<boolean>;
    deleteTenant(id: string): Promise<boolean>;
}

export class Tenancy implements ITenancy {
    private _context: TenancyContext;
    private _currentTenant: Tenant;
    private _loaders: TenancyLoaders;

    constructor(context: TenancyContext) {
        this._context = context;
        this._loaders = new TenancyLoaders(context);
    }

    get plugins() {
        return this._context.plugins.byType<TenantPlugin>(TenantPlugin.type);
    }

    async init() {
        await this.determineCurrentTenant();
    }

    async getRootTenant() {
        return this._loaders.getTenant.load("root");
    }

    getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant {
        return this._currentTenant as TTenant;
    }

    /**
     * Get tenant by ID
     * @param id
     */
    getTenantById<TTenant extends Tenant = Tenant>(id: string): Promise<TTenant> {
        return this._loaders.getTenant.load(id);
    }
    setCurrentTenant(tenant: Tenant) {
        this._currentTenant = tenant;
    }

    async listTenants<TTenant extends Tenant = Tenant>({ parent }): Promise<TTenant[]> {
        const [tenants] = await this._context.db.read<TTenant>({
            ...dbArgs,
            query: { GSI1_PK: `T#${parent}`, GSI1_SK: { $beginsWith: "T#" } },
            sort: { SK: -1 }
        });

        return tenants;
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

    private async determineCurrentTenant() {
        const { headers = {} } = this._context.http.request;

        let tenantId = headers["X-Tenant"] || headers["x-tenant"];
        if (!tenantId) {
            tenantId = "root";
        }

        if (!tenantCache[tenantId]) {
            const tenant = await this.getTenantById(tenantId);
            if (tenant) {
                tenantCache[tenantId] = tenant;
            }
        }

        this.setCurrentTenant(tenantCache[tenantId]);
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
