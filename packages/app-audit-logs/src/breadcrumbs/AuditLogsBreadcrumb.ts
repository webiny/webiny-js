import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the Audit Logs page: `Audit Logs`. The home entry is prepended
 * by the header.
 */
class AuditLogsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "auditLogs";
    route = Routes.AuditLogsList;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Audit Logs" }];
    }
}

export const AuditLogsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: AuditLogsBreadcrumbImpl,
    dependencies: []
});
