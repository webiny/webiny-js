import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the task definitions list: `Background Tasks › Definitions`.
 * The home entry is prepended by the header.
 */
class TaskDefinitionsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "backgroundTasks.definitions";
    route = Routes.Definitions;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Background Tasks" }, { label: "Definitions" }];
    }
}

export const TaskDefinitionsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: TaskDefinitionsBreadcrumbImpl,
    dependencies: []
});
