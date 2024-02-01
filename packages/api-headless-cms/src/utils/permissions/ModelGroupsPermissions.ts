import { AppPermissions, NotAuthorizedError } from "@webiny/api-security";
import { CmsGroup, CmsGroupPermission } from "~/types";

export interface CanAccessGroupParams {
    group: Pick<CmsGroup, "id" | "locale">;
}

export class ModelGroupsPermissions extends AppPermissions<CmsGroupPermission> {
    async canAccessGroup({ group }: CanAccessGroupParams) {
        if (await this.hasFullAccess()) {
            return true;
        }

        const permissions = await this.getPermissions();

        const locale = group.locale;

        for (const permission of permissions) {
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
                continue;
            }
            return true;
        }

        return false;
    }

    async ensureCanAccessGroup(params: CanAccessGroupParams) {
        const canAccessGroup = await this.canAccessGroup(params);
        if (canAccessGroup) {
            return;
        }

        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access group "${params.group.id}".`
            }
        });
    }
}
