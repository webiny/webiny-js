import { HttpRouter, HttpStreamBody, RouteNotFoundError } from "@webiny/event-handler-core";
import type { EventContext, IHttpResponse, NextFunction } from "@webiny/event-handler-core";
import { FunctionUrlStreamEventHandler } from "~/abstractions/handlers/FunctionUrlStreamEventHandler.js";
import { LambdaResponseStream } from "~/abstractions/LambdaResponseStream.js";
import { functionUrlEventToHttpRequest } from "~/translators/functionUrlEventToHttpRequest.js";
import { getAwsLambdaGlobal } from "~/streaming/awslambda.js";
import type { IRawResponseStream } from "~/streaming/awslambda.js";

const JSON_HEADERS = { "content-type": "application/json" };

/**
 * Terminal handler for the Lambda Function URL response-streaming transport. Routes through the same
 * `HttpRouter` every other transport uses, then writes the result to the invocation's response stream
 * — incrementally when the route returned an {@link HttpStreamBody}, in one shot otherwise.
 *
 * Mirrors `ApiGatewayHttpRouterHandler`, except nothing is returned: the response leaves through the
 * stream, so once the prelude is written the status code can no longer change.
 */
class FunctionUrlStreamRouterHandlerImpl implements FunctionUrlStreamEventHandler.Interface {
    constructor(
        private router: HttpRouter.Interface,
        private responseStream: LambdaResponseStream.Interface
    ) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<void> {
        const raw = this.responseStream.get();
        const request = functionUrlEventToHttpRequest(ctx.event);

        let response: IHttpResponse;
        try {
            response = await this.router.route(request);
        } catch (e) {
            await this.writeResponse(raw, this.errorResponse(e));
            return;
        }

        try {
            await this.writeResponse(raw, response);
        } catch (e) {
            // The prelude (and probably some body) is already out, so there is no way to turn this
            // into a 500. Destroy the stream so the client sees a truncated response instead of a
            // complete-looking one.
            console.error("Streaming HTTP handler failed mid-response:", e);
            if (raw.destroy) {
                raw.destroy(e instanceof Error ? e : new Error(String(e)));
            } else {
                raw.end();
            }
        }
    }

    private errorResponse(e: unknown): IHttpResponse {
        if (e instanceof RouteNotFoundError) {
            return { statusCode: 404, headers: JSON_HEADERS, body: { message: e.message } };
        }
        if (e && typeof e === "object" && (e as any).code) {
            console.error("HTTP handler WebinyError:", (e as any).code, (e as any).message, e);
            return {
                statusCode: 500,
                headers: JSON_HEADERS,
                body: {
                    message: (e as any).message,
                    code: (e as any).code,
                    data: (e as any).data ?? null
                }
            };
        }
        console.error("HTTP handler error:", e);
        return {
            statusCode: 500,
            headers: JSON_HEADERS,
            body: { message: "Internal server error" }
        };
    }

    private async writeResponse(raw: IRawResponseStream, response: IHttpResponse): Promise<void> {
        const { HttpResponseStream } = getAwsLambdaGlobal();

        // Sends the status code and headers as the stream prelude. Must happen before any write.
        const stream = HttpResponseStream.from(raw, {
            statusCode: response.statusCode,
            headers: response.headers
        });

        const { body } = response;

        // The runtime emits the prelude LAZILY, on the first write to the stream (its
        // `_onBeforeFirstWrite` hook). A response that writes nothing therefore sends no prelude at
        // all, and Lambda falls back to a default 200 with `application/octet-stream` and none of the
        // headers set above — silently, with no error. A CORS preflight (204, no body) and an empty
        // stream both hit this, so every path below guarantees at least one write.
        let wrote = false;

        if (HttpStreamBody.is(body)) {
            for await (const chunk of body.source) {
                if (stream.destroyed) {
                    // Client went away mid-stream; stop pulling from the producer.
                    break;
                }
                await this.write(stream, chunk);
                wrote = true;
            }
        } else if (body !== undefined && body !== null) {
            await this.write(stream, this.serialize(body));
            wrote = true;
        }

        if (!wrote) {
            // Zero-length write: flushes the prelude without adding body bytes, so a 204 stays a 204.
            await this.write(stream, "");
        }

        stream.end();
    }

    private serialize(body: any): Uint8Array | string {
        if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
            return body;
        }
        return typeof body === "string" ? body : JSON.stringify(body);
    }

    private async write(stream: IRawResponseStream, chunk: Uint8Array | string): Promise<void> {
        const flushed = stream.write(chunk);

        // The runtime hands over a Node Writable, so honour back-pressure when it signals a full
        // buffer. Guarded by feature detection: `write` is typed as possibly returning void, and a
        // stubbed stream (tests) need not implement `once`.
        if (flushed === false && typeof stream.once === "function") {
            await new Promise<void>(resolve => stream.once!("drain", resolve));
        }
    }
}

export const FunctionUrlStreamRouterHandler = FunctionUrlStreamEventHandler.createImplementation({
    implementation: FunctionUrlStreamRouterHandlerImpl,
    dependencies: [HttpRouter, LambdaResponseStream]
});
