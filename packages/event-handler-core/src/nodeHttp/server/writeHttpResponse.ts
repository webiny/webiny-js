import type { ServerResponse } from "node:http";
import { HttpStreamBody } from "~/index.js";
import type { IHttpResponse } from "~/index.js";
import { writeStreamBody } from "./writeStreamBody.js";
import { writeBufferedBody } from "./writeBufferedBody.js";

/**
 * Writes an IHttpResponse to the Node response: status line and headers, then the body — streamed
 * when the route opted in with an {@link HttpStreamBody}, buffered otherwise.
 */
export async function writeHttpResponse(
    res: ServerResponse,
    response: IHttpResponse
): Promise<void> {
    // `Set-Cookie` travels in its own field, not in `headers` — it is the one response header that
    // can legally repeat, which `Record<string, string>` cannot express. Node's `writeHead` takes an
    // array value for exactly that case.
    const headers: Record<string, string | string[]> = { ...response.headers };
    if (response.cookies && response.cookies.length > 0) {
        headers["set-cookie"] = response.cookies;
    }
    // A server shutting down has set `connection: close` on the response; a route's own value would
    // replace it in `writeHead` and keep the client sending requests on a connection about to close.
    if (res.getHeader("connection") === "close") {
        for (const name of Object.keys(headers)) {
            if (name.toLowerCase() === "connection") {
                delete headers[name];
            }
        }
    }

    res.writeHead(response.statusCode, headers);

    const { body } = response;

    if (HttpStreamBody.is(body)) {
        await writeStreamBody(res, body);
        return;
    }

    writeBufferedBody(res, body);
}
