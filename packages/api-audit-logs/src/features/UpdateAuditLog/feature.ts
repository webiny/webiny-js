import { createFeature } from "@webiny/feature/api";
import { UpdateAuditLogUseCase } from "./UpdateAuditLogUseCase.js";
import { UpdateAuditLogRepository } from "./UpdateAuditLogRepository.js";
import { UpdateAuditLogGateway } from "./UpdateAuditLogGateway.js";

export const UpdateAuditLogFeature = createFeature({
    name: "AuditLogs/UpdateAuditLog",
    register(container) {
        container.register(UpdateAuditLogUseCase);
        container.register(UpdateAuditLogRepository).inSingletonScope();
        container.register(UpdateAuditLogGateway).inSingletonScope();
    }
});
