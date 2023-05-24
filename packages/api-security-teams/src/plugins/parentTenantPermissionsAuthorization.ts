import { PermissionsTenantLink, SecurityContext } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { getPermissionsFromSecurityGroupsForLocale } from "./getPermissionsFromSecurityGroupsForLocale";

type Context = SecurityContext & TenancyContext & I18NContext;

export interface Config {
    identityType?: string;
    testTenantLink?: Pick<PermissionsTenantLink, "data">;
}

export const createTenantLinksAuthorizer = (config: Config) => (context: Context) => async () => {
    const { security, tenancy, i18n } = context;
    const identity = security.getIdentity();
    const tenant = tenancy.getCurrentTenant();
    const locale = i18n.getContentLocale();
    if (!locale) {
        return [];
    }

    if (!identity || identity.type !== config.identityType) {
        return null;
    }

    if (!tenant.parent) {
        return null;
    }

    const tenantLink =
        config.testTenantLink ||
        (await security.getTenantLinkByIdentity<PermissionsTenantLink>({
            identity: identity.id,
            tenant: tenant.parent
        }));

    if (!tenantLink || !tenantLink.data) {
        return null;
    }

    // Pick all groups and teams groups and get permissions from them.
    // Note that we return only permissions that are relevant for current locale.
    const teamsGroups = tenantLink.data.teams.map(team => team.groups).flat();

    return getPermissionsFromSecurityGroupsForLocale(teamsGroups, locale.code);
};

export default (config: Config) => {
    return new ContextPlugin<SecurityContext & TenancyContext & I18NContext>(context => {
        context.security.addAuthorizer(createTenantLinksAuthorizer(config)(context));
    });
};
