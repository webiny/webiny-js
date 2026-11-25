import type { ServerResponse } from "node:http";
import { HttpStreamBody } from "~/index.js";
import type { IHttpResponse } from "~/index.js";
import { writeStreamBody } from "./writeStreamBody.js";
import { writeBufferedBody } from "./writeBufferedBody.js";

/**
 * Headers about the connection rather than the response (RFC 9110, section 7.6.1). Node sets them
 * from what is written and from the server's state, such as `connection: close` while it shuts down;
 * a route's value would replace Node's in `writeHead`.
 */
const HOP_BY_HOP = [
    "connection",
    "proxy-connection",
    "keep-alive",
    "te",
    "transfer-encoding",
    "upgrade"
];

/**
 * Writes an IHttpResponse to the Node response: status line and headers, then the body — streamed
 * when the route opted in with an {@link HttpStreamBody}, buffered otherwise.
 */
export async function writeHttpResponse(
    res: ServerResponse,
    response: IHttpResponse
): Promise<void> {
    const headers: Record<string, string | string[]> = {};
    for (const [name, value] of Object.entries(response.headers ?? {})) {
        if (!HOP_BY_HOP.includes(name.toLowerCase())) {
            headers[name] = value;
        }
    }
    // `Set-Cookie` travels in its own field, not in `headers` — it is the one response header that
    // can legally repeat, which `Record<string, string>` cannot express. Node's `writeHead` takes an
    // array value for exactly that case.
    if (response.cookies && response.cookies.length > 0) {
        headers["set-cookie"] = response.cookies;
    }

    res.writeHead(response.statusCode, headers);

    const { body } = response;

    if (HttpStreamBody.is(body)) {
        await writeStreamBody(res, body);
        return;
    }

    writeBufferedBody(res, body);
}
