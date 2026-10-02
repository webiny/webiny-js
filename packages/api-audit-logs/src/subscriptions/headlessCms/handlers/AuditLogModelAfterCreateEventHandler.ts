import WebinyError from "@webiny/error";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogModelAfterCreateEventHandlerImpl implements ModelAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: ModelAfterCreateEventHandler.Event): Promise<void> {
        const { model } = event.payload;

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.MODEL.CREATE,
                message: "Model created",
                content: model,
                entityId: model.modelId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogModelAfterCreateEventHandler",
                code: "AUDIT_LOGS_AFTER_MODEL_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogModelAfterCreateEventHandler =
    ModelAfterCreateEventHandler.createImplementation({
        implementation: AuditLogModelAfterCreateEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
