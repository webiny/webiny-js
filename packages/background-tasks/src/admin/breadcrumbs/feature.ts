import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { TaskDefinitionsBreadcrumb } from "./TaskDefinitionsBreadcrumb.js";
import { TaskExecutionsBreadcrumb } from "./TaskExecutionsBreadcrumb.js";
import { TaskSettingsBreadcrumb } from "./TaskSettingsBreadcrumb.js";

export const BackgroundTasksBreadcrumbsFeature = createFeature({
    name: "BackgroundTasksBreadcrumbs",
    register(container: Container) {
        container.register(TaskDefinitionsBreadcrumb);
        container.register(TaskExecutionsBreadcrumb);
        container.register(TaskSettingsBreadcrumb);
    }
});
