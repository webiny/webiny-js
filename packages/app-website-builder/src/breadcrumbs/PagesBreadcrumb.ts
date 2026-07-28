import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the Website Builder pages list: `Website Builder › Pages`. The
 * home entry is prepended by the header.
 */
class PagesBreadcrumbImpl implements Breadcrumb.Interface {
    name = "websiteBuilder.pages";
    route = Routes.Pages.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Website Builder" }, { label: "Pages" }];
    }
}

export const PagesBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: PagesBreadcrumbImpl,
    dependencies: []
});
