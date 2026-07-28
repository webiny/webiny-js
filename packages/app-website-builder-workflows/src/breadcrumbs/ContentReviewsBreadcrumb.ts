import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the Website Builder content reviews page: `Website Builder ›
 * Content Reviews`. The home entry is prepended by the header.
 */
class ContentReviewsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "websiteBuilder.workflows.contentReviews";
    route = Routes.Pages.WorkflowStateList;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Website Builder" }, { label: "Content Reviews" }];
    }
}

export const ContentReviewsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ContentReviewsBreadcrumbImpl,
    dependencies: []
});
