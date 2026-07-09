import WebinyError from "@webiny/error";
import { AiBeforeGenerateTextEventHandler } from "@webiny/api-core/features/ai/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogAiBeforeGenerateTextHandlerImpl
    implements AiBeforeGenerateTextEventHandler.Interface
{
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: AiBeforeGenerateTextEventHandler.Event): Promise<void> {
        try {
            const { requestId, params } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.AI.TEXT.GENERATE);

            await createAuditLog(
                "AI Generate Text",
                {
                    before: {
                        model: params.model,
                        system: params.system,
                        prompt: params.prompt,
                        tools: params.tools ? Object.keys(params.tools) : []
                    }
                },
                requestId,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogAiBeforeGenerateTextHandler",
                code: "AUDIT_LOGS_AI_BEFORE_GENERATE_TEXT"
            });
        }
    }
}

export const AuditLogAiBeforeGenerateTextHandler =
    AiBeforeGenerateTextEventHandler.createImplementation({
        implementation: AuditLogAiBeforeGenerateTextHandlerImpl,
        dependencies: [AuditLogsContext]
    });
