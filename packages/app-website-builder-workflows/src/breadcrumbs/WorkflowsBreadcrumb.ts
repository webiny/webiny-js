import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the Website Builder workflows editor: `Website Builder ›
 * Workflows`. The home entry is prepended by the header.
 */
class WorkflowsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "websiteBuilder.workflows.list";
    route = Routes.Pages.Workflows;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Website Builder" }, { label: "Workflows" }];
    }
}

export const WorkflowsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: WorkflowsBreadcrumbImpl,
    dependencies: []
});
