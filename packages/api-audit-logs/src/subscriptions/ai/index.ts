import { AuditLogAiBeforeGenerateTextHandler } from "./handlers/AuditLogAiBeforeGenerateTextHandler.js";
import { AuditLogAiAfterGenerateTextHandler } from "./handlers/AuditLogAiAfterGenerateTextHandler.js";
import { AuditLogAiGenerateTextErrorHandler } from "./handlers/AuditLogAiGenerateTextErrorHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createAiHooks = (context: AuditLogsContext) => {
    context.container.register(AuditLogAiBeforeGenerateTextHandler);
    context.container.register(AuditLogAiAfterGenerateTextHandler);
    context.container.register(AuditLogAiGenerateTextErrorHandler);
};
