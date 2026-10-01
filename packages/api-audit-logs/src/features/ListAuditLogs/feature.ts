import { createFeature } from "@webiny/feature/api";
import { ListAuditLogsUseCase } from "./ListAuditLogsUseCase.js";
import { ListAuditLogsRepository } from "./ListAuditLogsRepository.js";

export const ListAuditLogsFeature = createFeature({
    name: "AuditLogs/ListAuditLogs",
    register(container) {
        container.register(ListAuditLogsUseCase);
        container.register(ListAuditLogsRepository).inSingletonScope();
    }
});
