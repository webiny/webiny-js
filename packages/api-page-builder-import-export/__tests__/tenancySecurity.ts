import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { SecurityContext, SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { ContextPlugin, BeforeHandlerPlugin } from "@webiny/api";
import { TenancyContext, Tenant } from "@webiny/api-tenancy/types";
import { Identity } from "../../api-authentication/src/types";

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
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
}

export const defaultIdentity: Identity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

const tenant = {
    id: "root",
    name: "Root",
    parent: null
} as unknown as Tenant;

const defaultPermission: SecurityPermission[] = [
    {
        name: "*"
    }
];

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
            context.tenancy.setCurrentTenant(tenant);

            context.security.addAuthenticator(async () => {
                return identity || defaultIdentity;
            });

            context.security.addAuthorizer(async () => {
                return permissions || defaultPermission;
            });
        }),
        new BeforeHandlerPlugin<SecurityContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
