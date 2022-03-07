import { SecurityContext } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/handler";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = TenancyContext & SecurityContext;

export interface GroupAuthorizerConfig {
    // Specify an `identityType` if you want to only run this authorizer for specific identities.
    identityType?: string;
    // Get a group slug to load permissions from.
    getGroupSlug(context: Context): string;
}

export const createGroupAuthorizer = (config: GroupAuthorizerConfig) => {
    return new ContextPlugin<Context>(context => {
        const { security } = context;
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            const tenant = context.tenancy.getCurrentTenant();

            if (!identity) {
                return null;
            }

            // If `identityType` is specified, we'll only execute this authorizer for a matching identity.
            if (config.identityType && identity.type !== config.identityType) {
                return null;
            }

            const groupSlug = config.getGroupSlug(context);
            let group = await security
                .getStorageOperations()
                .getGroup({ where: { slug: groupSlug, tenant: tenant.id } });

            if (group) {
                return group.permissions;
            }

            // If no security group was found, it could be due to an identity accessing a sub-tenant.
            // In this case, let's try loading a security group from the parent tenant.

            // NOTE: this will work well for flat tenant hierarchy where there's a `root` tenant and 1 level of sibling sub-tenants.
            // For multi-level hierarchy, the best approach is to code a plugin with the desired permission fetching logic.

            if (tenant.parent) {
                group = await security.getGroup({
                    where: { slug: groupSlug, tenant: tenant.parent }
                });

                return group ? group.permissions : null;
            }

            return null;
        });
    });
};
