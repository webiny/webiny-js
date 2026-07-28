import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { AuditLogsBreadcrumb } from "./AuditLogsBreadcrumb.js";

export const AuditLogsBreadcrumbsFeature = createFeature({
    name: "AuditLogsBreadcrumbs",
    register(container: Container) {
        container.register(AuditLogsBreadcrumb);
    }
});
