import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the content entries list: `Headless CMS › Entries`. The home
 * entry is prepended by the header. The model name and folder path are intentionally omitted
 * for now — both live in the per-mount scoped container and belong to a later, dynamic
 * iteration.
 */
class ContentEntriesBreadcrumbImpl implements Breadcrumb.Interface {
    name = "cms.contentEntries";
    route = Routes.ContentEntries.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [
            { label: "Headless CMS", to: { route: Routes.ContentModels.List } },
            { label: "Entries" }
        ];
    }
}

export const ContentEntriesBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ContentEntriesBreadcrumbImpl,
    dependencies: []
});
