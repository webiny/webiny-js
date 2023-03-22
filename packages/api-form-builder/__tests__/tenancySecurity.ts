import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityContext, SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { documentClient } from "~tests/documentClient";

interface Config {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
}

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
                settings: {
                    domains: []
                },
                description: "",
                status: "unknown",
                parent: null,
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                webinyVersion: "w.w.w"
            });

            context.security.addAuthenticator(async () => {
                return (
                    identity || {
                        id: "12345678",
                        type: "admin",
                        displayName: "John Doe"
                    }
                );
            });

            context.security.addAuthorizer(async () => {
                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<SecurityContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
