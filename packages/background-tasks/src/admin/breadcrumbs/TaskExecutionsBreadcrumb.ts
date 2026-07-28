import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the task executions list: `Background Tasks › Executions`. The
 * home entry is prepended by the header.
 */
class TaskExecutionsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "backgroundTasks.executions";
    route = Routes.Executions;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Background Tasks" }, { label: "Executions" }];
    }
}

export const TaskExecutionsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: TaskExecutionsBreadcrumbImpl,
    dependencies: []
});
