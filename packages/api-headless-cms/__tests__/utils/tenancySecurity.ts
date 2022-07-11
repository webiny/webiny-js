import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Plugin } from "@webiny/plugins/Plugin";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/handler";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TestContext } from "./types";

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
    setupGraphQL?: boolean;
    permissions: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const createTenancyAndSecurity = ({
    setupGraphQL,
    permissions,
    identity
}: Config): Plugin[] => {
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
        setupGraphQL ? createTenancyGraphQL() : null,
        createSecurityContext({
            storageOperations: securityStorageOperations({
                documentClient,
                table: process.env.DB_TABLE
            })
        }),
        setupGraphQL ? createSecurityGraphQL() : null,
        new ContextPlugin<TestContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                webinyVersion: context.WEBINY_VERSION
            } as any);

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
                    return null;
                }

                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<TestContext>(context => {
            const { headers = {} } = context.http.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
