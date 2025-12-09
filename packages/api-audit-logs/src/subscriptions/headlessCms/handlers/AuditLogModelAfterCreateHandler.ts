import WebinyError from "@webiny/error";
import { ModelAfterCreateHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogModelAfterCreateHandler implements ModelAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: ModelAfterCreateHandler.Event): Promise<void> {
        const { model } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.CREATE);

            await createAuditLog("Model created", model, model.modelId, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogModelAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_MODEL_CREATE_HANDLER"
            });
        }
    }
}
