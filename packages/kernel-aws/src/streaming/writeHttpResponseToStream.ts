import { HttpStreamBody } from "@webiny/kernel-core";
import type { IHttpResponse } from "@webiny/kernel-core";
import { getAwsLambdaGlobal } from "./awslambda.js";
import type { IRawResponseStream } from "./awslambda.js";

function serialize(body: any): Uint8Array | string {
    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        return body;
    }
    return typeof body === "string" ? body : JSON.stringify(body);
}

async function write(stream: IRawResponseStream, chunk: Uint8Array | string): Promise<void> {
    const flushed = stream.write(chunk);

    // The runtime hands over a Node Writable, so honour back-pressure when it signals a full
    // buffer. Guarded by feature detection: `write` is typed as possibly returning void, and a
    // stubbed stream (tests) need not implement `once`.
    if (flushed === false && typeof stream.once === "function") {
        await new Promise<void>(resolve => stream.once!("drain", resolve));
    }
}

/**
 * Writes an `IHttpResponse` to a Lambda Function URL response stream: the status code and headers as
 * the prelude, then the body, incrementally when it is an {@link HttpStreamBody}. Once the prelude is
 * written the status code can no longer change.
 */
export async function writeHttpResponseToStream(
    raw: IRawResponseStream,
    response: IHttpResponse
): Promise<void> {
    const { HttpResponseStream } = getAwsLambdaGlobal();

    // Sends the status code and headers as the stream prelude. Must happen before any write.
    // Cookies ride in their own prelude field, not in `headers`: `Set-Cookie` is the one response
    // header that can repeat, which `Record<string, string>` cannot express.
    const stream = HttpResponseStream.from(raw, {
        statusCode: response.statusCode,
        headers: response.headers,
        cookies: response.cookies
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
            await write(stream, chunk);
            wrote = true;
        }
    } else if (body !== undefined && body !== null) {
        const serialized = serialize(body);
        await write(stream, serialized);
        wrote = true;
    }

    if (!wrote) {
        // Zero-length write: flushes the prelude without adding body bytes, so a 204 stays a 204.
        await write(stream, "");
    }

    stream.end();
}
