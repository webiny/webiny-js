import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the content models list: `Headless CMS › Models`. The home
 * entry is prepended by the header.
 */
class ContentModelsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "cms.contentModels";
    route = Routes.ContentModels.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Headless CMS" }, { label: "Models" }];
    }
}

export const ContentModelsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ContentModelsBreadcrumbImpl,
    dependencies: []
});
