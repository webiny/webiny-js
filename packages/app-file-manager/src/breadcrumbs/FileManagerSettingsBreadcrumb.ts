import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the File Manager settings page: `Settings › File Manager`. The
 * home entry is prepended by the header.
 */
class FileManagerSettingsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "fileManager.settings";
    route = Routes.Settings;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Settings" }, { label: "File Manager" }];
    }
}

export const FileManagerSettingsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: FileManagerSettingsBreadcrumbImpl,
    dependencies: []
});
