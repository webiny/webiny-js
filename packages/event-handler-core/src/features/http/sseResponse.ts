import { HttpStreamBody } from "./HttpStreamBody.js";
import type { HttpStreamSource } from "./HttpStreamBody.js";
import type { IHttpResponse } from "./abstractions.js";

/**
 * Builds a server-sent-events response from a chunk source.
 *
 * The headers are the point of this helper. Two of them are not obvious and are easy to omit, and
 * omitting them produces a response that looks correct while never arriving incrementally:
 * - `no-transform` stops CloudFront (and other proxies) compressing the body, which buffers chunks.
 * - `x-accel-buffering: no` opts out of nginx-family response buffering.
 *
 * Framing the events is the caller's job — `source` should already yield complete `data: ...\n\n`
 * records.
 */
export function sseResponse(source: HttpStreamSource): IHttpResponse {
    return {
        statusCode: 200,
        headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
            "x-accel-buffering": "no"
        },
        body: new HttpStreamBody(source)
    };
}
