import { Context } from "~/index";
import { Plugin } from "@webiny/plugins/Plugin";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";

interface IConfig {
    permissions: SecurityPermission[];
    tenant?: Pick<Tenant, "id" | "name">;
}

export const getDefaultIdentity = (permissions: SecurityPermission[]): SecurityIdentity => {
    return {
        id: "id-12345678",
        type: "admin",
        displayName: "John Doe",
        permissions
    };
};

export const getDefaultTenant = (tenant?: Partial<Tenant>): Tenant => {
    return {
        id: "root",
        name: "Root",
        parent: null,
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        description: "Root tenant",
        status: "active",
        tags: [],
        settings: {
            domains: []
        },
        ...tenant
    };
};

export interface ILogin {
    identity: SecurityIdentity | null;
    setIdentity: (identity: SecurityIdentity | null) => void;
    getIdentity: () => SecurityIdentity | null;
}

const login: ILogin = {
    identity: null,
    setIdentity: identity => {
        login.identity = identity;
    },
    getIdentity: () => {
        return login.identity;
    }
};

export const createTenancyAndSecurity = ({ permissions, tenant }: IConfig) => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    const plugins = [
        createTenancyContext({ storageOperations: tenancyStorage.storageOperations }),
        createTenancyGraphQL(),
        createSecurityContext({ storageOperations: securityStorage.storageOperations }),
        createSecurityGraphQL(),
        new ContextPlugin<Context>(async context => {
            const identity = login.getIdentity();
            if (!identity) {
                return;
            }
            context.tenancy.setCurrentTenant(getDefaultTenant(tenant));
            context.security.setIdentity(identity);
        }),
        new ContextPlugin<Context>(context => {
            context.security.addAuthenticator(async () => {
                return login.getIdentity();
            });

            context.security.addAuthorizer(async () => {
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return login.getIdentity()?.permissions || null;
            });
        })
    ].filter(Boolean) as Plugin[];
    return {
        plugins,
        tenant: getDefaultTenant(tenant),
        login: (identity?: SecurityIdentity | null) => {
            login.setIdentity(
                identity === null ? null : identity || getDefaultIdentity(permissions)
            );
        }
    };
};
