import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/handler";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { AdminUsersContext } from "~/types";
import { createGroupAuthorizer } from "@webiny/api-security/plugins/groupAuthorization";

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
    fullAccess?: boolean;
    identity?: SecurityIdentity;
}

export const createTenancyAndSecurity = ({ fullAccess, identity }: Config = {}) => {
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
                status: "unknown",
                parent: null,
                settings: {
                    domains: []
                },
                description: "",
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                webinyVersion: process.env.WEBINY_VERSION as string
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

            const groupAuthorizer = createGroupAuthorizer({ identityType: "admin" })(context);
            context.security.addAuthorizer(async () => {
                if (fullAccess) {
                    return [{ name: "*" }];
                }

                return groupAuthorizer();
            });
        }),
        new BeforeHandlerPlugin<SecurityContext & AdminUsersContext>(context => {
            // We need to set an exact user ID to match the Identity ID
            context.adminUsers.onUserBeforeCreate.subscribe(({ user }) => {
                if (user.email === "admin@webiny.com") {
                    user.id = "12345678";
                }
            });

            return context.security.authenticate("");
        })
    ];
};
