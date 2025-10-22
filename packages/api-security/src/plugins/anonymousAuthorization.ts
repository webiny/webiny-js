import { ContextPlugin } from "@webiny/api";
import type { SecurityContext } from "~/types.js";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";

export default () => {
    return new ContextPlugin<SecurityContext & TenancyContext>(({ security, tenancy }) => {
        security.addAuthorizer(async () => {
            const tenant = tenancy.getCurrentTenant();

            if (!tenant) {
                return [];
            }

            if (security.getIdentity()) {
                return null;
            }

            // We assume that all other authorization plugins have already been executed.
            // If we've reached this far, it means that we have an anonymous user
            // and we need to load permissions from the "anonymous" group.
            const group = await security.withoutAuthorization(() => {
                return security.getGroup({ where: { slug: "anonymous" } });
            });

            return group ? group.permissions || [] : [];
        });
    });
};
