import { createFeature } from "@webiny/feature/api";
import { AiChatConfig } from "./abstractions.js";
import { AiChatUseCase } from "./AiChatUseCase.js";

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

/**
 * Enough steps for the deepest expected chain: list models, describe one, query it, answer — plus room
 * for a corrected retry after a rejected filter.
 */
const DEFAULT_MAX_STEPS = 12;

/**
 * The AI chat feature: a use case and its configuration, and nothing about how it is reached.
 *
 * Deliberately transport-free. Registering this gives you `AiChatUseCase` in the container; exposing it
 * over HTTP, a CLI command or anything else is a separate package's job.
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
    }
});
