import type { ServerResponse } from "node:http";
import { HttpStreamBody } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
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
    res.writeHead(response.statusCode, response.headers);

    const { body } = response;

    if (HttpStreamBody.is(body)) {
        await writeStreamBody(res, body);
        return;
    }

    writeBufferedBody(res, body);
}
