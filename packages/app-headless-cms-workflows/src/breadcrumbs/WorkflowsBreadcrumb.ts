import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the CMS workflows editor list: `Headless CMS › Workflows`. The
 * home entry is prepended by the header.
 */
class WorkflowsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "cms.workflows.list";
    route = Routes.ContentModels.Workflows;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Headless CMS" }, { label: "Workflows" }];
    }
}

export const WorkflowsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: WorkflowsBreadcrumbImpl,
    dependencies: []
});
