import type { IAuditLog } from "~/types.js";

export const EDITOR_HEIGHT = "calc(100vh - 350px)";

export interface AiAuditPayload {
    before?: {
        model?: string;
        system?: string | { content?: string; role?: string };
        prompt?: string;
        tools?: string[];
    };
    after?: {
        status?: "success" | "error";
        duration?: number;
        text?: string;
        usage?: unknown;
        finishReason?: string;
        steps?: number;
        toolCalls?: number;
        error?: { message?: string; name?: string };
    };
}

export function isAiGenerateText(auditLog: IAuditLog): boolean {
    return auditLog.app === "AI" && auditLog.entity.value === "TEXT";
}

export function hasAfter(auditLog: IAuditLog): boolean {
    if (!isAiGenerateText(auditLog)) {
        return false;
    }
    try {
        const content = JSON.parse(auditLog.content);
        return !!content.after;
    } catch {
        return false;
    }
}
