import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { RolesBreadcrumb } from "./RolesBreadcrumb.js";
import { TeamsBreadcrumb } from "./TeamsBreadcrumb.js";
import { ApiKeysBreadcrumb } from "./ApiKeysBreadcrumb.js";

export const AccessManagementBreadcrumbsFeature = createFeature({
    name: "AccessManagementBreadcrumbs",
    register(container: Container) {
        container.register(RolesBreadcrumb);
        container.register(TeamsBreadcrumb);
        container.register(ApiKeysBreadcrumb);
    }
});
