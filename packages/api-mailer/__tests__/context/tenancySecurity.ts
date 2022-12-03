import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { createPermissions } from "./helpers";
import { MailerContext } from "~/types";

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
    permissions: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
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
            verifyIdentityToTenantLink: false,
            storageOperations: securityStorageOperations({
                documentClient,
                table: process.env.DB_TABLE
            })
        }),
        createSecurityGraphQL(),
        new ContextPlugin<MailerContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                parent: null,
                description: "",
                status: "unknown",
                settings: {
                    domains: []
                },
                webinyVersion: context.WEBINY_VERSION,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });

            context.security.addAuthenticator(async () => {
                const base = identity || {
                    id: "12345678",
                    type: "admin",
                    displayName: "John Doe"
                };
                return {
                    ...base,
                    permissions: createPermissions().concat({ name: "pb.*" })
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
        new BeforeHandlerPlugin<MailerContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean);
};
