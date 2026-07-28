import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the Content Reviews page: `Content Reviews`. The home entry is
 * prepended by the header.
 */
class ContentReviewsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "workflows.contentReviews";
    route = Routes.Workflows.ContentReviews;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Content Reviews" }];
    }
}

export const ContentReviewsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ContentReviewsBreadcrumbImpl,
    dependencies: []
});
