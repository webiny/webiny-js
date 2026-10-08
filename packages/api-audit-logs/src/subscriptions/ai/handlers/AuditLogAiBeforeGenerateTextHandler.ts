import WebinyError from "@webiny/error";
import { AiBeforeGenerateTextEventHandler } from "@webiny/api-core/features/ai/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogAiBeforeGenerateTextHandlerImpl
    implements AiBeforeGenerateTextEventHandler.Interface
{
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: AiBeforeGenerateTextEventHandler.Event): Promise<void> {
        try {
            const { requestId, params } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.AI.TEXT.GENERATE,
                message: "AI Generate Text",
                content: {
                    before: {
                        model: params.model,
                        system: params.system,
                        prompt: params.prompt,
                        tools: params.tools ? Object.keys(params.tools) : []
                    }
                },
                entityId: requestId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
        dependencies: [RecordAuditLogUseCase]
    });
