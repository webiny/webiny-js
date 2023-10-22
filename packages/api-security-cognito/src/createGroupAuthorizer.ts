import { getPermissionsFromSecurityGroupsForLocale } from "@webiny/api-security";
import { CoreContext } from "~/types";

export const createGroupAuthorizer = (context: CoreContext, groupSlug: string) => {
    return async () => {
        return context.security.withoutAuthorization(async () => {
            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18n?.getContentLocale();

            if (!locale) {
                return null;
            }

            const group = await context.security.getGroup({
                where: { slug: groupSlug, tenant: tenant.id }
            });

            if (group) {
                return getPermissionsFromSecurityGroupsForLocale([group], locale.code);
            }

            return null;
        });
    };
};
