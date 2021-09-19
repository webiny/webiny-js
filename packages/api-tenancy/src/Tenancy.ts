import { Tenant } from "./types";
import { PluginsContainer } from "@webiny/plugins";
import { Tenants } from "~/Tenancy/Tenants";
import { System } from "~/Tenancy/System";
import { TenancyPlugin } from "~/plugins/TenancyPlugin";

export interface TenancyConfig {
    tenant: string;
    plugins: PluginsContainer;
    version: string;
}

export class Tenancy {
    public system: System;
    public tenants: Tenants;
    protected currentTenant: Tenant;
    protected config: TenancyConfig;

    constructor(config: TenancyConfig) {
        this.config = config;
        this.tenants = new Tenants(this);
        this.system = new System(this);
    }

    getPlugins() {
        return this.config.plugins;
    }

    getVersion() {
        return this.config.version;
    }

    async init() {
        const plugins = this.config.plugins.byType<TenancyPlugin>(TenancyPlugin.type);
        for (let i = 0; i < plugins.length; i++) {
            await plugins[i].apply(this);
        }

        if (this.config.tenant) {
            const tenant = await this.tenants.getTenantById(this.config.tenant);
            this.setCurrentTenant(tenant);
        }
    }

    getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant {
        return this.currentTenant as TTenant;
    }

    setCurrentTenant(tenant: Tenant) {
        this.currentTenant = tenant;
    }
}
