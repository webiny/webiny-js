import { HttpRoute } from "@webiny/event-handler-core";
import { HttpStreamBody } from "@webiny/event-handler-core";
import { toSseFrame } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { AiChatUseCase } from "@webiny/ai-chat/api/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import type { AiChatEvent } from "@webiny/ai-chat/api/index.js";
import { parseChatBody } from "./parseChatBody.js";
import { jsonResponse } from "./jsonResponse.js";

import { AI_CHAT_FLAG } from "./AI_CHAT_FLAG.js";

const SSE_HEADERS = {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    /* Proxies that buffer the body would defeat the point of streaming at all. */
    "x-accel-buffering": "no"
};

/**
 * Frame the feature's events as SSE records. The wire format comes from `event-handler-core`; which
 * events exist, and what they carry, belongs to the feature — so the mapping lives here.
 */
async function* toSseFrames(events: AsyncIterable<AiChatEvent>): AsyncIterable<string> {
    for await (const event of events) {
        yield toSseFrame(event);
    }
}

/**
 * `POST /ai/chat/stream` — the same assistant as `/ai/chat`, reported as it works.
 *
 * A separate route rather than a flag on the buffered one: the two have genuinely different response
 * contracts (one JSON object versus an event stream), so a client picks which it wants by the URL it
 * calls, and the buffered route stays available for callers that cannot read a stream.
 *
 * Failures after the first byte cannot become a status code — the response has already committed to
 * 200 — so the use case reports them as `error` events and the stream ends normally.
 */
class AiChatStreamRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    /*
     * Under `/stream/*` because that prefix is what reaches a transport able to stream. On AWS,
     * CloudFront routes `/stream/*` to the Lambda Function URL origin; everything else goes to API
     * Gateway, which buffers the whole response no matter how the route produced it. A path outside
     * this prefix still works — it just silently arrives all at once.
     */
    public readonly path = "/stream/ai/chat";

    public constructor(
        private readonly aiChat: AiChatUseCase.Interface,
        private readonly featureFlags: FeatureFlags.Interface
    ) {}

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        // See AiChatRoute: absent rather than forbidden when switched off.
        if (!this.featureFlags.get().isEnabled(AI_CHAT_FLAG)) {
            return jsonResponse(404, { error: "Not found." });
        }

        const parsed = parseChatBody(request.body);

        if (!parsed) {
            return jsonResponse(400, {
                error: "Provide either a non-empty `prompt` string or a `messages` array of model messages."
            });
        }

        return {
            statusCode: 200,
            headers: SSE_HEADERS,
            body: new HttpStreamBody(toSseFrames(this.aiChat.stream(parsed)))
        };
    }
}

export const AiChatStreamRoute = HttpRoute.createImplementation({
    implementation: AiChatStreamRouteImpl,
    dependencies: [AiChatUseCase, FeatureFlags]
});
