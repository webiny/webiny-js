import { Plugin } from "@webiny/plugins";
import { SecurityPermission, SecurityRole } from "~/types";

export interface SecurityRolePluginParams {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    permissions?: SecurityPermission[];
    tenant?: string;
}

export class SecurityRolePlugin extends Plugin {
    public static override readonly type: string = "security-role";
    public readonly securityRole: SecurityRole;

    constructor(params: SecurityRolePluginParams) {
        super();

        const { id, name, slug = id, description = "", permissions = [], tenant = null } = params;

        this.securityRole = {
            id,
            name,
            slug,
            description,
            permissions,
            tenant,

            // Internal properties.
            system: false,
            plugin: true,
            createdBy: null,
            createdOn: null,
            webinyVersion: null
        };
    }
}

export const createSecurityRolePlugin = (
    securityRole: SecurityRolePluginParams
): SecurityRolePlugin => {
    return new SecurityRolePlugin(securityRole);
};
