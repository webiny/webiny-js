import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the File Manager page: `File Manager`. The home entry is
 * prepended by the header. The folder path is intentionally omitted for now — that would
 * need the per-mount folder state and belongs to a later, dynamic iteration.
 */
class FileManagerBreadcrumbImpl implements Breadcrumb.Interface {
    name = "fileManager";
    route = Routes.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "File Manager" }];
    }
}

export const FileManagerBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: FileManagerBreadcrumbImpl,
    dependencies: []
});
