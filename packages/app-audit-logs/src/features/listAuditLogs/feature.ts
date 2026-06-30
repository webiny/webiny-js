import { createFeature } from "@webiny/feature/admin";
import { ListAuditLogsUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { ListAuditLogsUseCase } from "./ListAuditLogsUseCase.js";
import { ListAuditLogsRepository } from "./ListAuditLogsRepository.js";
import { ListAuditLogsGateway } from "./ListAuditLogsGateway.js";

export const ListAuditLogsFeature = createFeature({
    name: "AuditLogs/ListAuditLogs",
    register(container) {
        container.register(ListAuditLogsUseCase);
        container.register(ListAuditLogsRepository).inSingletonScope();
        container.register(ListAuditLogsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
