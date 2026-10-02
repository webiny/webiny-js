import WebinyError from "@webiny/error";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogModelAfterDeleteEventHandlerImpl implements ModelAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: ModelAfterDeleteEventHandler.Event): Promise<void> {
        const { model } = event.payload;

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.MODEL.DELETE,
                message: "Model deleted",
                content: model,
                entityId: model.modelId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogModelAfterDeleteEventHandler",
                code: "AUDIT_LOGS_AFTER_MODEL_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogModelAfterDeleteEventHandler =
    ModelAfterDeleteEventHandler.createImplementation({
        implementation: AuditLogModelAfterDeleteEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
