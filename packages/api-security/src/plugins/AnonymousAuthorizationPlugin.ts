import { AuthorizationPlugin } from "./AuthorizationPlugin";
import { Security } from "../Security";

export class AnonymousAuthorizationPlugin extends AuthorizationPlugin {
    async getPermissions(security: Security) {
        const tenant = security.getTenant();

        if (!tenant) {
            return [];
        }

        if (security.getIdentity()) {
            return;
        }

        // We assume that all other authorization plugins have already been executed.
        // If we've reached this far, it means that we have an anonymous user
        // and we need to load permissions from the "anonymous" group.
        const group = await security.groups.getGroup("anonymous", { auth: false });

        return group ? group.permissions || [] : [];
    }
}
