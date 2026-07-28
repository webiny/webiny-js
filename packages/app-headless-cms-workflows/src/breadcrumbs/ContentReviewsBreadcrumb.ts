import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the CMS content reviews page: `Headless CMS › Content Reviews`.
 * The home entry is prepended by the header.
 */
class ContentReviewsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "cms.workflows.contentReviews";
    route = Routes.ContentEntries.ContentReviews;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Headless CMS" }, { label: "Content Reviews" }];
    }
}

export const ContentReviewsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ContentReviewsBreadcrumbImpl,
    dependencies: []
});
