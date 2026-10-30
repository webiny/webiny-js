import { createFeature } from "@webiny/feature/api";
import { CreateAuditLogUseCase } from "./CreateAuditLogUseCase.js";
import { CreateAuditLogRepository } from "./CreateAuditLogRepository.js";
import { CreateAuditLogGateway } from "./CreateAuditLogGateway.js";

export const CreateAuditLogFeature = createFeature({
    name: "AuditLogs/CreateAuditLog",
    register(container) {
        container.register(CreateAuditLogUseCase);
        container.register(CreateAuditLogRepository).inSingletonScope();
        container.register(CreateAuditLogGateway).inSingletonScope();
    }
});
