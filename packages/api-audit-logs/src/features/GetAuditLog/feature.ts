import { createFeature } from "@webiny/feature/api";
import { GetAuditLogUseCaseImplementation } from "./GetAuditLogUseCase.js";

export const GetAuditLogFeature = createFeature({
    name: "GetAuditLog",
    register(container) {
        container.register(GetAuditLogUseCaseImplementation);
    }
});
