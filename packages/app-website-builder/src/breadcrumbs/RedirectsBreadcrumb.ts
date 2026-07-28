import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the Website Builder redirects list: `Website Builder ›
 * Redirects`. The home entry is prepended by the header.
 */
class RedirectsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "websiteBuilder.redirects";
    route = Routes.Redirects.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Website Builder" }, { label: "Redirects" }];
    }
}

export const RedirectsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: RedirectsBreadcrumbImpl,
    dependencies: []
});
