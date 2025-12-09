import WebinyError from "@webiny/error";
import { ModelAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogModelAfterUpdateHandler implements ModelAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

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
