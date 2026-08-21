import { createFeature } from "@webiny/feature/api";
import { AiChatConfig } from "./abstractions.js";
import { AiChatRoute } from "./AiChatRoute.js";
import { AiChatUseCase } from "./AiChatUseCase.js";

export { AiChatRoute };
export { AiChatUseCase };
export { AiChatConfig };
export type { IAiChatConfig } from "./abstractions.js";
export type { IAiChatUseCase } from "./abstractions.js";
export type { AiChatParams } from "./abstractions.js";
export type { AiChatResult } from "./abstractions.js";
export { SYSTEM_PROMPT } from "./systemPrompt.js";
export { isReadOnly } from "./approvals.js";
export type { PendingApproval } from "./approvals.js";
export type { ApprovalDecision } from "./approvals.js";

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

/**
 * Enough steps for the deepest expected chain: list models, describe one, query it, answer — plus room
 * for a corrected retry after a rejected filter.
 */
const DEFAULT_MAX_STEPS = 12;

/**
 * Registers `POST /ai/chat` and the use case behind it on the per-request container, alongside the
 * tools it will call.
 */
export const AiChatFeature = createFeature({
    name: "AiChat",
    register: container => {
        const config: {
            model: string;
            maxSteps: number;
            approvalSecret?: string;
        } = {
            model: process.env["WEBINY_API_AI_CHAT_MODEL"] || DEFAULT_MODEL,
            maxSteps: Number(process.env["WEBINY_API_AI_CHAT_MAX_STEPS"]) || DEFAULT_MAX_STEPS
        };

        /*
         * Unset means read-only: mutating tools are withheld rather than gated on an approval we cannot
         * verify. Opt in by setting the secret.
         */
        const approvalSecret = process.env["WEBINY_API_AI_CHAT_APPROVAL_SECRET"];
        if (approvalSecret) {
            config.approvalSecret = approvalSecret;
        }

        container.registerInstance(AiChatConfig, config);
        container.register(AiChatUseCase);
        container.register(AiChatRoute);
    }
});
