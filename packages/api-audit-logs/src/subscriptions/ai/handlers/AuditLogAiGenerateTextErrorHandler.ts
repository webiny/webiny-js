import WebinyError from "@webiny/error";
import { AiGenerateTextErrorEventHandler } from "@webiny/api-core/features/ai/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogAiGenerateTextErrorHandlerImpl implements AiGenerateTextErrorEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: AiGenerateTextErrorEventHandler.Event): Promise<void> {
        try {
            const { requestId, error, duration } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.AI.TEXT.GENERATE,
                message: "AI Generate Text",
                content: {
                    after: {
                        status: "error",
                        duration: Math.round(duration),
                        error: {
                            message: error.message,
                            name: error.name
                        }
                    }
                },
                entityId: requestId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
        dependencies: [RecordAuditLogUseCase]
    });
