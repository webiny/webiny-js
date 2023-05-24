import { PermissionsTenantLink, SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = SecurityContext & TenancyContext;

export interface Config {
    identityType?: string;
    testTenantLink?: Pick<PermissionsTenantLink, "data">;
}

export const createGroupAuthorizer =
    (config: Config) =>
    ({ security, tenancy }: Context) =>
    async () => {
        const identity = security.getIdentity();
        const tenant = tenancy.getCurrentTenant();

        if (!identity || identity.type !== config.identityType) {
            return null;
        }

        const tenantLink =
            config.testTenantLink ||
            (await security.getTenantLinkByIdentity<PermissionsTenantLink>({
                identity: identity.id,
                tenant: tenant.id
            }));

        const groups = tenantLink?.data?.groups;
        if (!Array.isArray(groups)) {
            return null;
        }

        // Although only one group is allowed, we still pretend multiples are possible.
        // This way, in the near future, we can support multiple groups per tenant.
        return groups.map(group => group.permissions).flat();
    };

export default (config: Config) => {
    return new ContextPlugin<SecurityContext & TenancyContext>(context => {
        context.security.addAuthorizer(createGroupAuthorizer(config)(context));
    });
};
