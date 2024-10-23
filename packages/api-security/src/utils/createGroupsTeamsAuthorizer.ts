import { ContextPlugin } from "@webiny/handler";
import { SecurityContext } from "~/types";
import {
    GroupsTeamsAuthorizerConfig,
    listPermissionsFromGroupsAndTeams
} from "./createGroupsTeamsAuthorizer/listPermissionsFromGroupsAndTeams";

export type { GroupsTeamsAuthorizerConfig };

export const createGroupsTeamsAuthorizer = <TContext extends SecurityContext = SecurityContext>(
    config: GroupsTeamsAuthorizerConfig<TContext>
) => {
    return new ContextPlugin<TContext>(context => {
        const { security, tenancy } = context;
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            if (!identity) {
                return null;
            }

            // If `identityType` is specified, we'll only execute this authorizer for a matching identity.
            if (config.identityType && identity.type !== config.identityType) {
                return null;
            }

            // @ts-expect-error Check `packages/api-security/src/plugins/tenantLinkAuthorization.ts:23`.
            const locale = context.i18n?.getContentLocale();
            if (!locale) {
                return null;
            }

            if (config.canAccessTenant) {
                const canAccessTenant = await config.canAccessTenant(context);
                if (!canAccessTenant) {
                    return [];
                }
            }

            const currentTenantPermissions = await listPermissionsFromGroupsAndTeams<TContext>({
                config,
                context,
                identity,
                localeCode: locale.code
            });

            if (Array.isArray(currentTenantPermissions)) {
                return currentTenantPermissions;
            }

            // If no security groups were found, it could be due to an identity accessing a sub-tenant. In this case,
            // let's try loading permissions from the parent tenant. Note that this will work well for flat tenant
            // hierarchy where there's a `root` tenant and 1 level of sibling sub-tenants. For multi-level hierarchy,
            // the best approach is to code a plugin with the desired permissions-fetching logic.
            if (config.inheritGroupsFromParentTenant === false) {
                return null;
            }

            const parentTenantId = context.tenancy.getCurrentTenant().parent;
            if (!parentTenantId) {
                return null;
            }

            const parentTenant = await tenancy.getTenantById(parentTenantId);
            if (!parentTenant) {
                return null;
            }

            const parentTenantPermissions = await tenancy.withTenant(parentTenant, async () => {
                return listPermissionsFromGroupsAndTeams({
                    config,
                    context,
                    identity,
                    localeCode: locale.code
                });
            });

            if (Array.isArray(parentTenantPermissions)) {
                return parentTenantPermissions;
            }

            return null;
        });
    });
};
