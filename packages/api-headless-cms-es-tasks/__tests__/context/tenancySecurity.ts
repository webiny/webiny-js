import type { Plugin } from "@webiny/plugins/Plugin";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import type { Context } from "~/types";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { SecurityPermission } from "@webiny/api-core/types/security";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
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

export const createTenancyAndSecurity = ({ permissions, identity }: Config): Plugin[] => {
    return [
        new ContextPlugin<Context>(async context => {
            await createTenantIfMissing(context.tenancy, {
                id: "root",
                name: "Root",
                parent: "",
                description: "Root tenant",
                tags: []
            });

            await createTenantIfMissing(context.tenancy, {
                id: "webiny",
                name: "Webiny",
                parent: "",
                description: "Webiny tenant",
                tags: []
            });

            await createTenantIfMissing(context.tenancy, {
                id: "dev",
                name: "Dev",
                parent: "",
                description: "Dev tenant",
                tags: []
            });

            await createTenantIfMissing(context.tenancy, {
                id: "sales",
                name: "Sales",
                parent: "",
                description: "Sales tenant",
                tags: []
            });
        }),
        new ContextPlugin<Context>(async context => {
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
        new BeforeHandlerPlugin<Context>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
