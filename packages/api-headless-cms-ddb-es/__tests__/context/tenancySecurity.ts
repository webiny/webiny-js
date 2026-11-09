import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { CmsContext } from "~/types";
import { SecurityPermission } from "@webiny/api-core/types/security";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Tenant } from "@webiny/api-core/types/tenancy";
import type { CreateTenantInput } from "@webiny/api-core/types/tenancy.js";

/**
 * Test setup runs for every request: create the tenant only when it doesn't exist yet
 * (creating an existing tenant fails).
 */
const createTenantIfMissing = async (
    tenancy: {
        getTenantById(id: string): Promise<unknown>;
        createTenant(data: CreateTenantInput): Promise<unknown>;
    },
    data: CreateTenantInput
) => {
    try {
        await tenancy.getTenantById(data.id!);
        return;
    } catch {
        // Tenant doesn't exist yet.
    }
    await tenancy.createTenant(data);
};

interface Config {
    setupGraphQL?: boolean;
    permissions: SecurityPermission[];
    identity?: IdentityData | null;
}

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const createTenant = (
    input: Pick<Tenant, "id" | "name" | "parent" | "tags" | "description">
): Tenant => {
    return {
        ...input,
        parent: input.parent,
        status: "active",
        isInstalled: true,
        savedOn: new Date().toISOString(),
        createdOn: new Date().toISOString(),
        settings: {
            domains: []
        }
    };
};

export const tenants: Tenant[] = [
    createTenant({
        id: "root",
        name: "Root",
        parent: "",
        description: "Root tenant",
        tags: []
    }),
    createTenant({
        id: "webiny",
        name: "Webiny",
        parent: "",
        description: "Webiny tenant",
        tags: []
    }),
    createTenant({
        id: "dev",
        name: "Dev",
        parent: "",
        description: "Dev tenant",
        tags: []
    }),
    createTenant({
        id: "sales",
        name: "Sales",
        parent: "",
        description: "Sales tenant",
        tags: []
    })
];

export const createTenancyAndSecurity = ({ permissions, identity }: Config): Plugin[] => {
    return [
        new ContextPlugin<CmsContext>(async context => {
            for (const tenant of tenants) {
                await createTenantIfMissing(context.tenancy, {
                    ...tenant,
                    parent: tenant.parent || ""
                });
            }
        }),
        new ContextPlugin<CmsContext>(async context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root"
            } as unknown as Tenant);

            context.security.addAuthenticator(async () => {
                return identity || defaultIdentity;
            });

            context.security.addAuthorizer(async () => {
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<CmsContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
