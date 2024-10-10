import { SecurityContext } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { getPermissionsFromSecurityGroupsForLocale } from "@webiny/api-security";

type Context = TenancyContext & SecurityContext & I18NContext;

export type GroupSlug = string | undefined;

export interface GroupAuthorizerConfig<TContext extends Context = Context> {
    // Specify an `identityType` if you want to only run this authorizer for specific identities.
    identityType?: string;

    // Get a group slug to load permissions from.
    getGroupSlug?: (context: TContext) => Promise<GroupSlug> | GroupSlug;
}

export const createGroupAuthorizer = <TContext extends Context = Context>(
    config: GroupAuthorizerConfig<TContext>
) => {
    return new ContextPlugin<TContext>(context => {
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

            const locale = context.i18n?.getContentLocale();
            if (!locale) {
                return null;
            }

            const groupSlug = config.getGroupSlug
                ? await config.getGroupSlug(context)
                : identity.group;

            if (!groupSlug) {
                return null;
            }

            let group = await security
                .getStorageOperations()
                .getGroup({ where: { slug: groupSlug, tenant: tenant.id } });

            if (group) {
                return getPermissionsFromSecurityGroupsForLocale([group], locale.code);
            }

            // If no security group was found, it could be due to an identity accessing a sub-tenant.
            // In this case, let's try loading a security group from the parent tenant.

            // NOTE: this will work well for flat tenant hierarchy where there's a `root` tenant and 1 level of sibling sub-tenants.
            // For multi-level hierarchy, the best approach is to code a plugin with the desired permission fetching logic.

            if (tenant.parent) {
                group = await security.getGroup({
                    where: { slug: groupSlug, tenant: tenant.parent }
                });

                if (group) {
                    return getPermissionsFromSecurityGroupsForLocale([group], locale.code);
                }
            }

            return null;
        });
    });
};
