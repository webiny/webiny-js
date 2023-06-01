import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    SecurityContext,
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext, TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { Identity } from "@webiny/api-authentication/types";

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
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    return [
        createTenancyContext({ storageOperations: tenancyStorage.storageOperations }),
        createTenancyGraphQL(),
        createSecurityContext({ storageOperations: securityStorage.storageOperations }),
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
