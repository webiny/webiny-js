import { AppPermissions, NotAuthorizedError } from "@webiny/api-security";
import { CmsGroup, CmsGroupPermission } from "~/types";

interface CanAccessGroupParams {
    group: CmsGroup;
    locale: string;
}

export class ModelGroupsPermissions extends AppPermissions<CmsGroupPermission> {
    async canAccessGroup({ group, locale }: CanAccessGroupParams) {
        if (await this.hasFullAccess()) {
            return true;
        }

        const permissions = await this.getPermissions();

        for (let i = 0; i < permissions.length; i++) {
            const permission = permissions[i];
            const { groups } = permission;
            // When no groups defined on permission it means user has access to everything.
            if (!groups) {
                return true;
            }

            // when there is no locale in groups, it means that no access was given
            // this happens when access control was set but no models or groups were added
            if (
                Array.isArray(groups[locale]) === false ||
                groups[locale].includes(group.id) === false
            ) {
                return false;
            }
            return true;
        }

        return false;
    }

    async ensureCanAccessGroup(params: CanAccessGroupParams) {
        const canAccessModel = await this.canAccessGroup(params);
        if (canAccessModel) {
            return;
        }

        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access group "${params.group.id}".`
            }
        });
    }
}
