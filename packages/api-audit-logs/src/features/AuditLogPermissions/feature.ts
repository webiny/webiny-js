import { createFeature } from "@webiny/feature/api";
import { AuditLogPermissions } from "./AuditLogPermissions.js";

export const AuditLogPermissionsFeature = createFeature({
    name: "AuditLogs/AuditLogPermissions",
    register(container) {
        container.register(AuditLogPermissions);
    }
});
