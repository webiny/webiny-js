import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { FileManagerBreadcrumb } from "./FileManagerBreadcrumb.js";
import { FileManagerSettingsBreadcrumb } from "./FileManagerSettingsBreadcrumb.js";

export const FileManagerBreadcrumbsFeature = createFeature({
    name: "FileManagerBreadcrumbs",
    register(container: Container) {
        container.register(FileManagerBreadcrumb);
        container.register(FileManagerSettingsBreadcrumb);
    }
});
