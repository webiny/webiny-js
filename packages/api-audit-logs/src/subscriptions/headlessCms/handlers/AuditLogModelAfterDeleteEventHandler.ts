import WebinyError from "@webiny/error";
import { ModelAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogModelAfterDeleteHandlerImpl implements ModelAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: ModelAfterDeleteHandler.Event): Promise<void> {
        const { model } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.DELETE);

            await createAuditLog("Model deleted", model, model.modelId, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogModelAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_MODEL_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogModelAfterDeleteEventHandler = ModelAfterDeleteHandler.createImplementation({
    implementation: AuditLogModelAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
