import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the content model groups list: `Headless CMS › Model Groups`.
 * The home entry is prepended by the header.
 */
class ContentModelGroupsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "cms.contentModelGroups";
    route = Routes.ContentModelGroups.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Headless CMS" }, { label: "Model Groups" }];
    }
}

export const ContentModelGroupsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ContentModelGroupsBreadcrumbImpl,
    dependencies: []
});
