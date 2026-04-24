import WebinyError from "@webiny/error";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogModelAfterDeleteEventHandlerImpl implements ModelAfterDeleteEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: ModelAfterDeleteEventHandler.Event): Promise<void> {
        const { model } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.DELETE);

            await createAuditLog("Model deleted", model, model.modelId, this.context);
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
        dependencies: [AuditLogsContext]
    });
