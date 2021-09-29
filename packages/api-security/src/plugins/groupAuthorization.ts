import { GroupTenantLink, SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext } from "@webiny/api-tenancy/types";

export interface Config {
    identityType?: string;
}

export default (config: Config) => {
    return new ContextPlugin<SecurityContext & TenancyContext>(({ security, tenancy }) => {
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            const tenant = tenancy.getCurrentTenant();

            if (!identity || identity.type !== config.identityType) {
                return null;
            }

            const tenantLink = await security.getTenantLinkByIdentity<GroupTenantLink>({
                identity: identity.id,
                tenant: tenant.id
            });

            if (!tenantLink || !tenantLink.data.permissions) {
                return null;
            }

            return tenantLink.data.permissions;
        });
    });
};
