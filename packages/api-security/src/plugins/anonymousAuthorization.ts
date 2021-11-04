import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

export default () => {
    return new ContextPlugin<SecurityContext & TenancyContext>(({ security, tenancy }) => {
        security.addAuthorizer(async () => {
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
            const group = await security.getGroup({ where: { slug: "anonymous" } });

            return group ? group.permissions || [] : [];
        });
    });
};
