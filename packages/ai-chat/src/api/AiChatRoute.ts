import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponseBuilder } from "@webiny/event-handler-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AiChatUseCase } from "./abstractions.js";
import { parseChatBody } from "./parseChatBody.js";

const BAD_REQUEST_MESSAGE =
    "Provide either a non-empty `prompt` string or a `messages` array of model messages.";

/**
 * `POST /ai/chat`, transport only. Parses the request, delegates to `AiChatUseCase`, and maps failures
 * onto status codes. All assistant behaviour lives in the use case.
 *
 * Kept alongside the streaming route for callers that cannot read a stream. It buffers the whole
 * answer, so a multi-tool question returns once, after several seconds of silence.
 */
class AiChatRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/ai/chat";

    public constructor(
        private readonly aiChat: AiChatUseCase.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async handle(
        request: IHttpRequest,
        response: IHttpResponseBuilder
    ): Promise<IHttpResponseBuilder> {
        const parsed = parseChatBody(request.body);

        if (!parsed) {
            return response.status(400).json({ error: BAD_REQUEST_MESSAGE });
        }

        try {
            return response.json(await this.aiChat.execute(parsed));
        } catch (error) {
            const code = (error as { code?: string }).code;

            if (code === "NOT_AUTHORIZED") {
                return response.status(401).json({ error: "Authentication required." });
            }

            const message = error instanceof Error ? error.message : String(error);
            this.logger.error({ error }, "AI chat request failed.");

            return response.status(500).json({ error: message });
        }
    }
}

export const AiChatRoute = HttpRoute.createImplementation({
    implementation: AiChatRouteImpl,
    dependencies: [AiChatUseCase, Logger]
});
