import WebinyError from "@webiny/error";
import { AiAfterGenerateTextEventHandler } from "@webiny/api-core/features/ai/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogAiAfterGenerateTextHandlerImpl implements AiAfterGenerateTextEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: AiAfterGenerateTextEventHandler.Event): Promise<void> {
        try {
            const { requestId, result, duration } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.AI.TEXT.GENERATE,
                message: "AI Generate Text",
                content: {
                    after: {
                        status: "success",
                        duration: Math.round(duration),
                        text: result.text,
                        usage: result.usage,
                        finishReason: result.finishReason,
                        steps: result.steps.length,
                        toolCalls: result.steps.reduce(
                            (sum, step) => sum + step.toolCalls.length,
                            0
                        )
                    }
                },
                entityId: requestId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogAiAfterGenerateTextHandler",
                code: "AUDIT_LOGS_AI_AFTER_GENERATE_TEXT"
            });
        }
    }
}

export const AuditLogAiAfterGenerateTextHandler =
    AiAfterGenerateTextEventHandler.createImplementation({
        implementation: AuditLogAiAfterGenerateTextHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
