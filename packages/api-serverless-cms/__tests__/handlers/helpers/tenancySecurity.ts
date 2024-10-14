import { Context } from "~/index";
import { Plugin } from "@webiny/plugins/Plugin";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    ApiKey,
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";

interface IConfig {
    setupGraphQL?: boolean;
    permissions: SecurityPermission[];
    identity?: SecurityIdentity;
    tenant?: Pick<Tenant, "id" | "name">;
}

export const getDefaultIdentity = (): SecurityIdentity => {
    return {
        id: "id-12345678",
        type: "admin",
        displayName: "John Doe"
    };
};

export const getDefaultTenant = (): Tenant => {
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
        }
    };
};

export const createTenancyAndSecurity = ({
    setupGraphQL,
    permissions,
    identity,
    tenant: inputTenant
}: IConfig): Plugin[] => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    const tenant = inputTenant || getDefaultTenant();

    return [
        createTenancyContext({ storageOperations: tenancyStorage.storageOperations }),
        setupGraphQL ? createTenancyGraphQL() : null,
        createSecurityContext({ storageOperations: securityStorage.storageOperations }),
        setupGraphQL ? createSecurityGraphQL() : null,
        new ContextPlugin<Context>(context => {
            context.tenancy.setCurrentTenant({
                ...tenant,
                webinyVersion: context.WEBINY_VERSION
            } as unknown as Tenant);

            context.security.addAuthenticator(async () => {
                return identity || getDefaultIdentity();
            });

            context.security.addAuthorizer(async () => {
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<Context>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        }),
        {
            type: "context",
            name: "context-security-tenant",
            async apply(context) {
                context.security.getApiKeyByToken = async (
                    token: string
                ): Promise<ApiKey | null> => {
                    if (!token || token !== "aToken") {
                        return null;
                    }
                    const apiKey = "a1234567890";
                    return {
                        id: apiKey,
                        name: apiKey,
                        tenant: tenant.id,
                        permissions: identity?.permissions || [],
                        token,
                        createdBy: {
                            id: "test",
                            displayName: "test",
                            type: "admin"
                        },
                        description: "test",
                        createdOn: new Date().toISOString(),
                        webinyVersion: context.WEBINY_VERSION
                    };
                };
            }
        } as ContextPlugin<Context>
    ].filter(Boolean) as Plugin[];
};
