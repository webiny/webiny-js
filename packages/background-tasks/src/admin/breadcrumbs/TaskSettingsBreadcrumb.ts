import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the background tasks settings page: `Background Tasks ›
 * Settings`. The home entry is prepended by the header.
 */
class TaskSettingsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "backgroundTasks.settings";
    route = Routes.Settings;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Background Tasks" }, { label: "Settings" }];
    }
}

export const TaskSettingsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: TaskSettingsBreadcrumbImpl,
    dependencies: []
});
