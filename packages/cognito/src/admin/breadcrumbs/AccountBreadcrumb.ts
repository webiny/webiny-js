import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the current-user account page: `Account`. The home entry is
 * prepended by the header.
 */
class AccountBreadcrumbImpl implements Breadcrumb.Interface {
    name = "cognito.account";
    route = Routes.Users.Account;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Account" }];
    }
}

export const AccountBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: AccountBreadcrumbImpl,
    dependencies: []
});
