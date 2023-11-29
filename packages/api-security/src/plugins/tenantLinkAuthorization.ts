import { PermissionsTenantLink, SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { getPermissionsFromSecurityGroupsForLocale } from "~/utils/getPermissionsFromSecurityGroupsForLocale";

type Context = SecurityContext & TenancyContext;

export interface Config {
    identityType?: string;
    testTenantLink?: Pick<PermissionsTenantLink, "data">;
    parent?: boolean;
}

export const createTenantLinkAuthorizer = (config: Config) => (context: Context) => async () => {
    const identity = context.security.getIdentity();
    const tenant = context.tenancy.getCurrentTenant();

    // I18N is not a dependency of this package. Yet, it always goes hand in hand with it.
    // Since, in the future, we'll most probably merge all of these base packages into one,
    // we'll just ignore the TS error for now and pretend I18N is always available.
    // This way we make the setup easier for the end user; no need to create an extra
    // NPM package just to get the I18N context which the user would need to set up manually.
    // @ts-expect-error
    const locale = context.i18n?.getContentLocale() as { code: string };
    if (!locale) {
        return null;
    }

    if (!identity || identity.type !== config.identityType) {
        return null;
    }

    const tenantId = config.parent ? tenant.parent : tenant.id;
    if (!tenantId) {
        return null;
    }

    const tenantLink =
        config.testTenantLink ||
        (await context.security.getTenantLinkByIdentity<PermissionsTenantLink>({
            identity: identity.id,
            tenant: tenantId
        }));

    if (!tenantLink) {
        return null;
    }

    const allGroups = [];

    const groups = tenantLink.data?.groups;
    if (Array.isArray(groups)) {
        allGroups.push(...groups);
    }

    let teamsEnabled = false;
    if (context.wcp.canUseFeature("advancedAccessControlLayer")) {
        const license = context.wcp.getProjectLicense();
        teamsEnabled = license!.package.features.advancedAccessControlLayer.options.teams;
    }

    if (teamsEnabled) {
        // Pick all groups and teams groups and get permissions from them.
        // Note that we return only permissions that are relevant for current locale.
        const teamsGroups = tenantLink.data?.teams.map(team => team.groups).flat();
        if (Array.isArray(teamsGroups)) {
            allGroups.push(...teamsGroups);
        }
    }

    // Although only one group is allowed, we still pretend multiples are possible.
    // This way, in the near future, we can support multiple groups per tenant.
    return getPermissionsFromSecurityGroupsForLocale(allGroups, locale.code);
};

export default (config: Config) => {
    return new ContextPlugin<SecurityContext & TenancyContext>(context => {
        context.security.addAuthorizer(createTenantLinkAuthorizer(config)(context));
    });
};
