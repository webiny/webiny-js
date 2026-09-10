import WebinyError from "@webiny/error";
import { AiGenerateTextErrorEventHandler } from "@webiny/api-core/features/ai/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogAiGenerateTextErrorHandlerImpl implements AiGenerateTextErrorEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: AiGenerateTextErrorEventHandler.Event): Promise<void> {
        try {
            const { requestId, error, duration } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.AI.TEXT.GENERATE);

            await createAuditLog(
                "AI Generate Text",
                {
                    after: {
                        status: "error",
                        duration: Math.round(duration),
                        error: {
                            message: error.message,
                            name: error.name
                        }
                    }
                },
                requestId,
                this.context
            );
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Error while executing AuditLogAiGenerateTextErrorHandler",
                code: "AUDIT_LOGS_AI_GENERATE_TEXT_ERROR"
            });
        }
    }
}

export const AuditLogAiGenerateTextErrorHandler =
    AiGenerateTextErrorEventHandler.createImplementation({
        implementation: AuditLogAiGenerateTextErrorHandlerImpl,
        dependencies: [AuditLogsContext]
    });
