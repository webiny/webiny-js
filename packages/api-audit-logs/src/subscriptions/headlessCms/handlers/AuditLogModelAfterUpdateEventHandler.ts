import WebinyError from "@webiny/error";
import { ModelAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogRecorder } from "~/abstractions.js";

class AuditLogModelAfterUpdateEventHandlerImpl implements ModelAfterUpdateEventHandler.Interface {
    constructor(private recorder: AuditLogRecorder.Interface) {}

    async handle(event: ModelAfterUpdateEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.UPDATE);

            await createAuditLog(
                "Model updated",
                { before: original, after: model },
                model.modelId,
                this.recorder
            );
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
        dependencies: [AuditLogRecorder]
    });
