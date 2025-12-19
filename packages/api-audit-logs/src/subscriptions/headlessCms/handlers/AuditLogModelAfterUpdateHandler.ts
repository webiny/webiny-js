import WebinyError from "@webiny/error";
import { ModelAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogModelAfterUpdateHandlerImpl implements ModelAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: ModelAfterUpdateHandler.Event): Promise<void> {
        const { model, original } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.UPDATE);

            await createAuditLog(
                "Model updated",
                { before: original, after: model },
                model.modelId,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogModelAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_MODEL_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogModelAfterUpdateHandler = ModelAfterUpdateHandler.createImplementation({
    implementation: AuditLogModelAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
