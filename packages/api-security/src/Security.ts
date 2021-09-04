import minimatch from "minimatch";
import { Authentication } from "@webiny/api-authentication/Authentication";
import { PluginsContainer } from "@webiny/plugins";
import { SecurityIdentity } from "./SecurityIdentity";
import { SecurityPermission } from "./types";
import { AuthorizationPlugin } from "./plugins/AuthorizationPlugin";
import { SecurityPlugin } from "./plugins/SecurityPlugin";
import { Groups } from "./Security/Groups";
import { System } from "./Security/System";
import { Identity } from "./Security/Identity";
import { ApiKeys } from "./Security/ApiKeys";

export interface SecurityConfig {
    tenant: string;
    plugins: PluginsContainer;
    version: string;
}

export class Security extends Authentication<SecurityIdentity> {
    protected config: SecurityConfig;
    protected permissions: SecurityPermission[];
    public identity: Identity;
    public system: System;
    public groups: Groups;
    public apiKeys: ApiKeys;

    constructor(config: SecurityConfig) {
        super();
        this.config = config;

        this.system = new System(this);
        this.identity = new Identity(this);
        this.groups = new Groups(this);
        this.apiKeys = new ApiKeys(this);
    }

    get version() {
        return this.config.version;
    }

    async init() {
        const plugins = this.config.plugins.byType<SecurityPlugin>(SecurityPlugin.type);
        for (let i = 0; i < plugins.length; i++) {
            await plugins[i].apply(this);
        }
    }

    getIdentity<TIdentity extends SecurityIdentity = SecurityIdentity>(): TIdentity {
        return super.getIdentity() as TIdentity;
    }

    getTenant() {
        return this.config.tenant;
    }

    getPlugins() {
        return this.config.plugins;
    }

    async getPermission<TPermission extends SecurityPermission = SecurityPermission>(
        permission: string
    ): Promise<TPermission | null> {
        const perms = await this.getPermissions();
        const exactMatch = perms.find(p => p.name === permission);
        if (exactMatch) {
            return exactMatch as TPermission;
        }

        // Try matching using patterns
        const matchedPermission = perms.find(p => minimatch(permission, p.name));
        if (matchedPermission) {
            return matchedPermission as TPermission;
        }

        return null;
    }

    async getPermissions(): Promise<SecurityPermission[]> {
        if (Array.isArray(this.permissions)) {
            return this.permissions;
        }

        const authorizationPlugins = this.config.plugins.byType<AuthorizationPlugin>(
            AuthorizationPlugin.type
        );

        for (let i = 0; i < authorizationPlugins.length; i++) {
            const result = await authorizationPlugins[i].getPermissions(this);
            if (Array.isArray(result)) {
                this.permissions = result;

                return result;
            }
        }

        // Set an empty array since no permissions were found.
        return (this.permissions = []);
    }

    async hasFullAccess(): Promise<boolean> {
        const permissions = (await this.getPermissions()) as SecurityPermission[];

        return permissions.some(p => p.name === "*");
    }
}
