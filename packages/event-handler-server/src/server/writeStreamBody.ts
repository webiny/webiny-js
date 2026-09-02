import { once } from "node:events";
import type { ServerResponse } from "node:http";
import type { HttpStreamBody } from "@webiny/event-handler-core";

/**
 * Writes a streaming body chunk by chunk, so the client sees data as the producer emits it.
 */
export async function writeStreamBody(res: ServerResponse, body: HttpStreamBody): Promise<void> {
    // Flush the headers now — Node otherwise holds them until the first write, so the client would
    // see nothing until the producer emits its first chunk.
    res.flushHeaders();

    for await (const chunk of body.source) {
        if (res.destroyed) {
            // Client went away mid-stream; stop pulling from the producer.
            break;
        }

        const flushed = res.write(chunk);

        // Respect back-pressure: `write` returning false means the socket buffer is full, and
        // ignoring that would grow it without bound on a slow consumer.
        if (!flushed) {
            await once(res, "drain");
        }
    }

    if (!res.destroyed) {
        res.end();
    }
}
