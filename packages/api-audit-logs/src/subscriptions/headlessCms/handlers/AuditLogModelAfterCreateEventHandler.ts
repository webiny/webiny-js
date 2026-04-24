import WebinyError from "@webiny/error";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogModelAfterCreateEventHandlerImpl implements ModelAfterCreateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: ModelAfterCreateEventHandler.Event): Promise<void> {
        const { model } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.CREATE);

            await createAuditLog("Model created", model, model.modelId, this.context);
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
        dependencies: [AuditLogsContext]
    });
