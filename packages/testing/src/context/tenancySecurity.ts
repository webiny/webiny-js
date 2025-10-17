import type { Plugin } from "@webiny/plugins";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import {
    createSecurityContext,
    createSecurityGraphQL,
    createSecurityRolePlugin,
    createSecurityTeamPlugin
} from "@webiny/api-security";
import type {
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types.js";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types.js";
import createAdminUsersApp from "@webiny/api-admin-users";
import { createStorageOperations as createAdminUsersStorageOperations } from "@webiny/api-admin-users-so-ddb";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";

interface Config {
    setupGraphQL?: boolean;
    permissions: SecurityPermission[];
    identity?: SecurityIdentity | null;
    documentClient: DynamoDBDocument;
}

export const defaultIdentity: SecurityIdentity = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const FULL_ACCESS_ROLE_ID = "full-access-role";
export const FULL_ACCESS_TEAM_ID = "full-access-team";

export const createTenancyAndSecurity = ({
    permissions,
    identity,
    documentClient
}: Config): Plugin[] => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    return [
        createTenancyContext({ storageOperations: tenancyStorage.storageOperations }),
        createTenancyGraphQL(),
        createSecurityContext({ storageOperations: securityStorage.storageOperations }),
        createSecurityGraphQL(),
        createAdminUsersApp({
            storageOperations: createAdminUsersStorageOperations({ documentClient })
        }),
        createSecurityRolePlugin({
            id: FULL_ACCESS_ROLE_ID,
            name: "Full Access",
            description: "Full access",
            permissions: [{ name: "*" }]
        }),
        createSecurityTeamPlugin({
            id: FULL_ACCESS_TEAM_ID,
            name: "Full access",
            description: "Full access",
            roles: ["full-access"]
        }),
        new ContextPlugin<Context>(async context => {
            context.adminUsers.listUserTeams = async () => {
                return await context.security.listTeams();
            };
        }),
        new ContextPlugin<Context>(async context => {
            await context.tenancy.createTenant({
                id: "root",
                name: "Root",
                parent: "",
                description: "Root tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "webiny",
                name: "Webiny",
                parent: "",
                description: "Webiny tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "dev",
                name: "Dev",
                parent: "",
                description: "Dev tenant",
                tags: []
            });

            await context.tenancy.createTenant({
                id: "sales",
                name: "Sales",
                parent: "",
                description: "Sales tenant",
                tags: []
            });
        }),
        new ContextPlugin<Context>(async context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                webinyVersion: context.WEBINY_VERSION
            } as unknown as Tenant);

            context.security.addAuthenticator(async () => {
                return {
                    ...(identity || defaultIdentity),
                    teams: ["full-access-team"]
                };
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
        })
    ].filter(Boolean) as Plugin[];
};
