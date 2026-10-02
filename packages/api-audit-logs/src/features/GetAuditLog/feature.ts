import { createFeature } from "@webiny/feature/api";
import { GetAuditLogUseCase } from "./GetAuditLogUseCase.js";
import { GetAuditLogRepository } from "./GetAuditLogRepository.js";
import { GetAuditLogGateway } from "./GetAuditLogGateway.js";

export const GetAuditLogFeature = createFeature({
    name: "AuditLogs/GetAuditLog",
    register(container) {
        container.register(GetAuditLogUseCase);
        container.register(GetAuditLogRepository).inSingletonScope();
        container.register(GetAuditLogGateway).inSingletonScope();
    }
});
