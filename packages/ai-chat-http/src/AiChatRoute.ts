import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AiChatUseCase } from "@webiny/ai-chat/api/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { parseChatBody } from "./parseChatBody.js";
import { jsonResponse } from "./jsonResponse.js";

import { AI_CHAT_FLAG } from "./AI_CHAT_FLAG.js";

const BAD_REQUEST_MESSAGE =
    "Provide either a non-empty `prompt` string or a `messages` array of model messages.";

/**
 * `POST /ai/chat` — transport only. Parses the request, delegates to `AiChatUseCase`, and maps failures
 * onto status codes. All assistant behaviour lives in the use case.
 */
class AiChatRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/ai/chat";

    public constructor(
        private readonly aiChat: AiChatUseCase.Interface,
        private readonly logger: Logger.Interface,
        private readonly featureFlags: FeatureFlags.Interface
    ) {}

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        /*
         * 404 rather than 403: when the assistant is switched off the endpoint should look absent, not
         * forbidden, so a disabled project reveals nothing about what it could do.
         */
        if (!this.featureFlags.get().isEnabled(AI_CHAT_FLAG)) {
            return jsonResponse(404, { error: "Not found." });
        }

        const parsed = parseChatBody(request.body);

        if (!parsed) {
            return jsonResponse(400, { error: BAD_REQUEST_MESSAGE });
        }

        try {
            return jsonResponse(200, await this.aiChat.execute(parsed));
        } catch (error) {
            const code = (error as { code?: string }).code;

            if (code === "NOT_AUTHORIZED") {
                return jsonResponse(401, { error: "Authentication required." });
            }

            const message = error instanceof Error ? error.message : String(error);
            this.logger.error({ error }, "AI chat request failed.");

            return jsonResponse(500, { error: message });
        }
    }
}

export const AiChatRoute = HttpRoute.createImplementation({
    implementation: AiChatRouteImpl,
    dependencies: [AiChatUseCase, Logger, FeatureFlags]
});
