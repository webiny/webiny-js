import { createFeature } from "@webiny/feature/api";
import { RecordAuditLogUseCase } from "./RecordAuditLogUseCase.js";

export const RecordAuditLogFeature = createFeature({
    name: "AuditLogs/RecordAuditLog",
    register(container) {
        container.register(RecordAuditLogUseCase);
    }
});
