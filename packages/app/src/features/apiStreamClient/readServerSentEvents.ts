/**
 * Read a `text/event-stream` response as a sequence of parsed JSON events.
 *
 * Written against `Response.body` rather than `EventSource` on purpose: `EventSource` can only issue
 * GET requests and cannot set an `Authorization` header, both of which the API requires.
 *
 * Only the `data:` field is interpreted — enough for Webiny's streaming routes, which frame one JSON
 * object per record. Comment lines (`:` heartbeats), `event:`, `id:` and `retry:` are ignored.
 */
export async function* readServerSentEvents<TEvent>(response: Response): AsyncGenerator<TEvent> {
    const body = response.body;
    if (!body) {
        throw new Error("The response carried no readable body.");
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // `stream: true` keeps a multi-byte character split across chunks intact.
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

            let separator = buffer.indexOf("\n\n");
            while (separator !== -1) {
                const record = buffer.slice(0, separator);
                buffer = buffer.slice(separator + 2);

                const data = record
                    .split("\n")
                    .filter(line => line.startsWith("data:"))
                    .map(line => line.slice("data:".length).trim())
                    .join("\n");

                if (data) {
                    yield JSON.parse(data) as TEvent;
                }

                separator = buffer.indexOf("\n\n");
            }
        }
    } finally {
        reader.releaseLock();
    }
}
