import minimatch from "minimatch";
import { createAuthentication } from "@webiny/api-authentication/createAuthentication";
import { Authorizer, Security, SecurityPermission, SecurityConfig } from "./types";
import { createApiKeysMethods } from "~/createSecurity/createApiKeysMethods";
import { createGroupsMethods } from "~/createSecurity/createGroupsMethods";
import { createSystemMethods } from "~/createSecurity/createSystemMethods";
import { createIdentityMethods } from "~/createSecurity/createIdentityMethods";

export interface GetTenant {
    (): string;
}

export const createSecurity = async (config: SecurityConfig): Promise<Security> => {
    const authentication = createAuthentication();
    const authorizers: Authorizer[] = [];
    let permissions: SecurityPermission[] = null;

    const security: Security = {
        ...authentication,
        addAuthorizer(authorizer: Authorizer) {
            authorizers.push(authorizer);
        },
        getAuthorizers() {
            return authorizers;
        },
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
        },

        async getPermissions(): Promise<SecurityPermission[]> {
            if (Array.isArray(permissions)) {
                return permissions;
            }

            for (const authorizer of authorizers) {
                const result = await authorizer();
                if (Array.isArray(result)) {
                    permissions = result;

                    return result;
                }
            }

            // Set an empty array since no permissions were found.
            return (permissions = []);
        },

        async hasFullAccess(): Promise<boolean> {
            const permissions = (await this.getPermissions()) as SecurityPermission[];

            return permissions.some(p => p.name === "*");
        },
        ...createIdentityMethods(config),
        ...createGroupsMethods(config),
        ...createApiKeysMethods(config),
        ...createSystemMethods(config)
    };
    
    return security;
};
