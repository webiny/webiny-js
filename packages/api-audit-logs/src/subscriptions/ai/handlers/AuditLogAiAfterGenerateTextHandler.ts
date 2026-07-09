import WebinyError from "@webiny/error";
import { AiAfterGenerateTextEventHandler } from "@webiny/api-core/features/ai/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogAiAfterGenerateTextHandlerImpl implements AiAfterGenerateTextEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: AiAfterGenerateTextEventHandler.Event): Promise<void> {
        try {
            const { requestId, result, duration } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.AI.GENERATE_TEXT.CREATE);

            await createAuditLog(
                "AI Generate Text",
                {
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
                requestId,
                this.context
            );
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
        dependencies: [AuditLogsContext]
    });
