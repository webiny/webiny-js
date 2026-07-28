import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "~/presentation/breadcrumbs/index.js";
import type { BreadcrumbTrailItem } from "~/presentation/breadcrumbs/index.js";
import { Routes } from "~/presentation/accessManagement/routes.js";

/**
 * Static breadcrumb trail for the roles list: `Access Management › Roles`. The home entry is
 * prepended by the header.
 */
class RolesBreadcrumbImpl implements Breadcrumb.Interface {
    name = "accessManagement.roles";
    route = Routes.Roles.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Access Management" }, { label: "Roles" }];
    }
}

export const RolesBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: RolesBreadcrumbImpl,
    dependencies: []
});
