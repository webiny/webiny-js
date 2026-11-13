import { createFeature } from "@webiny/feature/api";
import { ListAuditLogsUseCaseImplementation } from "./ListAuditLogsUseCase.js";

export const ListAuditLogsFeature = createFeature({
    name: "ListAuditLogs",
    register(container) {
        container.register(ListAuditLogsUseCaseImplementation);
    }
});
