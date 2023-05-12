import { GroupTenantLink, SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = SecurityContext & TenancyContext;

export interface Config {
    identityType?: string;
}

export const createParentTenantGroupAuthorizer =
    (config: Config) =>
    ({ security, tenancy }: Context) =>
    async () => {
        const identity = security.getIdentity();
        const tenant = tenancy.getCurrentTenant();

        if (!identity || identity.type !== config.identityType) {
            return null;
        }
        if (!tenant.parent) {
            return null;
        }

        const tenantLink = await security.getTenantLinkByIdentity<GroupTenantLink>({
            identity: identity.id,
            tenant: tenant.parent
        });

        if (!tenantLink || !tenantLink.data || !tenantLink.data.permissions) {
            return null;
        }

        return tenantLink.data.permissions;
    };

/**
 * This authorizer will check if the identity belongs to the parent tenant of the current tenant.
 * If so, parent tenant permissions will be loaded.
 */
export default (config: Config) => {
    return new ContextPlugin<SecurityContext & TenancyContext>(context => {
        context.security.addAuthorizer(createParentTenantGroupAuthorizer(config)(context));
    });
};
