import { HttpRoute, toSseFrame } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponseBuilder } from "@webiny/event-handler-core";
import { AiChatUseCase } from "./abstractions.js";
import type { AiChatEvent } from "./events.js";
import { parseChatBody } from "./parseChatBody.js";

const BAD_REQUEST_MESSAGE =
    "Provide either a non-empty `prompt` string or a `messages` array of model messages.";

/**
 * Frame the feature's events as SSE records. The wire format comes from `event-handler-core`; which
 * events exist, and what they carry, belongs to the feature, so the mapping lives here.
 */
async function* toSseFrames(events: AsyncIterable<AiChatEvent>): AsyncIterable<string> {
    for await (const event of events) {
        yield toSseFrame(event);
    }
}

/**
 * `POST /stream/ai/chat`, the same assistant as `/ai/chat` but reported as it works.
 *
 * A separate route rather than a flag on the buffered one: the two have genuinely different response
 * contracts (one JSON object versus an event stream), so a client picks which it wants by the URL it
 * calls, and the buffered route stays available for callers that cannot read a stream.
 *
 * Failures after the first byte cannot become a status code, since the response has already committed
 * to 200, so the use case reports them as `error` events and the stream ends normally.
 */
class AiChatStreamRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    /*
     * Under `/stream/*` because that prefix is what reaches a transport able to stream. On AWS,
     * CloudFront routes `/stream/*` to the Lambda Function URL origin; everything else goes to API
     * Gateway, which buffers the whole response no matter how the route produced it. A path outside
     * this prefix still works, it just silently arrives all at once.
     */
    public readonly path = "/stream/ai/chat";

    public constructor(private readonly aiChat: AiChatUseCase.Interface) {}

    public async handle(
        request: IHttpRequest,
        response: IHttpResponseBuilder
    ): Promise<IHttpResponseBuilder> {
        const parsed = parseChatBody(request.body);

        if (!parsed) {
            return response.status(400).json({ error: BAD_REQUEST_MESSAGE });
        }

        return response.sse(toSseFrames(this.aiChat.stream(parsed)));
    }
}

export const AiChatStreamRoute = HttpRoute.createImplementation({
    implementation: AiChatStreamRouteImpl,
    dependencies: [AiChatUseCase]
});
