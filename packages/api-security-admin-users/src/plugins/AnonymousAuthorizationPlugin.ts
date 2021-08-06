import { AdminUsersContext } from "~/types";
import { AuthorizationPlugin } from "@webiny/api-security/plugins/AuthorizationPlugin";

export class AnonymousAuthorizationPlugin extends AuthorizationPlugin<AdminUsersContext> {
    async getPermissions({ security, tenancy }: AdminUsersContext) {
        const tenant = tenancy.getCurrentTenant();
        if (!tenant) {
            return [];
        }

        if (security.getIdentity()) {
            return;
        }

        // We assume that all other authorization plugins have already been executed.
        // If we've reached this far, it means that we have an anonymous user
        // and we need to load permissions from the "anonymous" group.
        const group = await security.groups.getGroup("anonymous");

        return group ? group.permissions || [] : [];
    }
}
