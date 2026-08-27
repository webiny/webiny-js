/**
 * Server-sent event payloads emitted by `AiImageEnrichmentStreamRoute` — this feature's stream
 * protocol, not a shared one. The SSE wire format itself (`toSseFrame`) is transport-level and lives
 * in `@webiny/event-handler-core`; what the events are called and what they carry is per feature,
 * since the next streaming route will want a different set.
 *
 * A small domain protocol rather than the AI SDK's UI message stream: the client
 * doesn't render a chat transcript, it renders a progressively-completing `{ tags, description }`
 * object, which is exactly what `streamText`'s `partialOutputStream` produces. The admin app mirrors
 * these types (it can't import an api-side package), so keep the two in sync.
 */
export interface EnrichmentStreamStartEvent {
    type: "start";
    fileId: string;
    model: string;
}

export interface EnrichmentStreamPartialEvent {
    type: "partial";
    tags: string[];
    description: string;
}

export interface EnrichmentStreamDoneEvent {
    type: "done";
    fileId: string;
    /** The persisted tags — AI tags merged with the file's existing ones. */
    tags: string[];
    description: string;
}

export interface EnrichmentStreamErrorEvent {
    type: "error";
    message: string;
}

export type EnrichmentStreamEvent =
    | EnrichmentStreamStartEvent
    | EnrichmentStreamPartialEvent
    | EnrichmentStreamDoneEvent
    | EnrichmentStreamErrorEvent;
