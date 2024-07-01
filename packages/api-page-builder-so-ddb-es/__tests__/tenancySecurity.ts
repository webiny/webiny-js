import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityContext } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";

interface Params {
    documentClient: DynamoDBDocument;
}

export const defaultIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ documentClient }: Params) => {
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
                return defaultIdentity;
            });

            context.security.addAuthorizer(async () => {
                return [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<SecurityContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
