import { GroupTenantLink, SecurityContext, SecurityPermission } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";

type Context = SecurityContext & TenancyContext;

export interface Config {
    identityType?: string;
}

export const tenantLinksPermissionsAuthorization =
    (config: Config) =>
    ({ security, tenancy }: Context) =>
    async () => {
        const identity = security.getIdentity();
        const tenant = tenancy.getCurrentTenant();

        if (!identity || identity.type !== config.identityType) {
            return null;
        }

        const tenantLink = await security.getTenantLinkByIdentity<GroupTenantLink>({
            identity: identity.id,
            tenant: tenant.id
        });

        // Let's go through all the groups and teams permissions, and let's filter
        // out the ones that are not related to current locale.

        const permissions: Record<string, SecurityPermission[]> = {}


        if (!tenantLink || !tenantLink.data || !tenantLink.data.permissions) {
            return null;
        }

        return tenantLink.data.permissions;
    };

export default (config: Config) => {
    return new ContextPlugin<SecurityContext & TenancyContext & I18NContext>(context => {
        context.security.addAuthorizer(tenantLinksPermissionsAuthorization(config)(context));
    });
};
