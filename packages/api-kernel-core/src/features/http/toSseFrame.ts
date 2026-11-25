/**
 * Frame one value as a server-sent-events `data:` record.
 *
 * The SSE wire format, not any one feature's protocol: a record is `data: <payload>` followed by the
 * blank line that terminates it. What goes IN the payload — the event names and their fields — is per
 * feature and belongs with that feature.
 *
 * Counterpart to `readServerSentEvents` in `@webiny/app`, which parses these on the client.
 */
export function toSseFrame(data: unknown): string {
    return `data: ${JSON.stringify(data)}\n\n`;
}
