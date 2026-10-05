import WebinyError from "@webiny/error";
import { ModelAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogModelAfterUpdateEventHandlerImpl implements ModelAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: ModelAfterUpdateEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.MODEL.UPDATE,
                message: "Model updated",
                content: { before: original, after: model },
                entityId: model.modelId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogModelAfterUpdateEventHandler",
                code: "AUDIT_LOGS_AFTER_MODEL_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogModelAfterUpdateEventHandler =
    ModelAfterUpdateEventHandler.createImplementation({
        implementation: AuditLogModelAfterUpdateEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
