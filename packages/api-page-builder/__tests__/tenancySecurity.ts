import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityContext, SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { documentClient } from "./documentClient";

interface Config {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const defaultIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config = {}) => {
    return [
        createTenancyContext({
            storageOperations: tenancyStorageOperations({
                documentClient,
                table: table => ({
                    ...table,
                    name: process.env.DB_TABLE as string
                })
            })
        }),
        createTenancyGraphQL(),
        createSecurityContext({
            storageOperations: securityStorageOperations({
                documentClient,
                table: process.env.DB_TABLE
            })
        }),
        createSecurityGraphQL(),
        new ContextPlugin<SecurityContext & TenancyContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                webinyVersion: process.env.WEBINY_VERSION,
                description: "",
                parent: null,
                settings: {
                    domains: []
                },
                status: "any",
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                tags: []
            });

            context.security.addAuthenticator(async () => {
                return identity || defaultIdentity;
            });

            context.security.addAuthorizer(async () => {
                return typeof permissions === "undefined" ? [{ name: "*" }] : permissions;
            });
        }),
        new BeforeHandlerPlugin<SecurityContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
