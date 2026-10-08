import { AuditLogAiBeforeGenerateTextHandler } from "./handlers/AuditLogAiBeforeGenerateTextHandler.js";
import { AuditLogAiAfterGenerateTextHandler } from "./handlers/AuditLogAiAfterGenerateTextHandler.js";
import { AuditLogAiGenerateTextErrorHandler } from "./handlers/AuditLogAiGenerateTextErrorHandler.js";
import type { Container } from "@webiny/di";

export const createAiHooks = (container: Container) => {
    container.register(AuditLogAiBeforeGenerateTextHandler);
    container.register(AuditLogAiAfterGenerateTextHandler);
    container.register(AuditLogAiGenerateTextErrorHandler);
};
