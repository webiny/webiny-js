import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTenancyApp, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityApp, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityContext, SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { BeforeHandlerPlugin } from "@webiny/handler/plugins/BeforeHandlerPlugin";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";

type Context = BaseContext<SecurityContext, TenancyContext>;

// IMPORTANT: This must be removed from here in favor of a dynamic SO setup.
const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

interface Config {
    setupGraphQL: boolean;
    permissions: SecurityPermission[];
    identity: SecurityIdentity;
}

export const createTenancyAndSecurity = ({ setupGraphQL, permissions, identity }: Config) => {
    return [
        createTenancyApp({
            storageOperations: tenancyStorageOperations({
                documentClient,
                table: table => ({ ...table, name: process.env.DB_TABLE })
            })
        }),
        setupGraphQL ? createTenancyGraphQL() : null,
        createSecurityApp({
            storageOperations: securityStorageOperations({
                documentClient,
                table: process.env.DB_TABLE
            })
        }),
        setupGraphQL ? createSecurityGraphQL() : null,
        new ContextPlugin<Context>(context => {
            context.tenancy.setCurrentTenant({ id: "root", name: "Root" });

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
                const { headers = {} } = context.http.request || {};
                if (headers["authorization"]) {
                    return;
                }

                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<Context>(context => {
            const { headers = {} } = context.http.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean);
};
