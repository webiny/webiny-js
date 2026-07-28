import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the admin users list: `Users`. The home entry is prepended by
 * the header.
 */
class UsersBreadcrumbImpl implements Breadcrumb.Interface {
    name = "cognito.users";
    route = Routes.Users.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Users" }];
    }
}

export const UsersBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: UsersBreadcrumbImpl,
    dependencies: []
});
