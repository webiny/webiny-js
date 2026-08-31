import { createAbstraction } from "@webiny/feature/admin";

/**
 * Mirrors the server-sent event payloads emitted by the api-side `AiImageEnrichmentStreamRoute`
 * (see `streamEvents.ts` in `@webiny/ai-powerups`). Duplicated rather than imported: the admin app
 * must not depend on an api-side package. Keep the two in sync.
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

export interface IReenrichFileOptions {
    signal?: AbortSignal;
}

export interface IReenrichFileGateway {
    /**
     * Re-runs AI enrichment for a file, yielding progress events as they arrive.
     *
     * Failures the server detects before streaming starts (unknown file, non-image, no provider,
     * license) reject instead of yielding an `error` event — they come back as HTTP status codes.
     */
    execute(fileId: string, options?: IReenrichFileOptions): AsyncGenerator<EnrichmentStreamEvent>;
}

export const ReenrichFileGateway = createAbstraction<IReenrichFileGateway>("ReenrichFileGateway");

export namespace ReenrichFileGateway {
    export type Interface = IReenrichFileGateway;
    export type Event = EnrichmentStreamEvent;
}

export interface IReenrichWithAiViewModel {
    open: boolean;
    /** What the dialog says under its title: the error when there is one, else the status. */
    message: string;
    tags: string[];
    description: string;
    /** The proposal is complete, so it can be accepted. */
    canSave: boolean;
}

export interface IReenrichWithAiPresenter {
    readonly vm: IReenrichWithAiViewModel;
    start(fileId: string): Promise<void>;
    /**
     * Accept the proposal. Applies the values and closes immediately; the save runs in the
     * background and is rolled back if it fails.
     */
    save(): Promise<void>;
    setOpen(open: boolean): void;
    dispose(): void;
}

export const ReenrichWithAiPresenter = createAbstraction<IReenrichWithAiPresenter>(
    "FileManager/ReenrichWithAiPresenter"
);

export namespace ReenrichWithAiPresenter {
    export type Interface = IReenrichWithAiPresenter;
    export type ViewModel = IReenrichWithAiViewModel;
}
