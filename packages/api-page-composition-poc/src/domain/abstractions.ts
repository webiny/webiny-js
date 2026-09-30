import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ComposedCapture, ComposePagesResult, PageMap } from "~/domain/types.js";
import type { PageCompositionError } from "~/domain/errors.js";

/**
 * The run's source-URL → page map. On the tenant key-value store, keyed by run id, so this PoC keeps
 * its own state and adds no field to the extraction run's model.
 */
export interface IPageMapStore {
    get(runId: string): Promise<Result<PageMap | null, PageCompositionError>>;
    set(map: PageMap): Promise<Result<void, PageCompositionError>>;
}

export const PageMapStore = createAbstraction<IPageMapStore>("PageCompositionPoc/PageMapStore");

export namespace PageMapStore {
    export type Interface = IPageMapStore;
}

/**
 * Screenshots of a run's composed pages, written by whoever last ran the local harness.
 *
 * Its own key rather than a field on the page map, so a recompose does not delete the evidence that
 * a comparison was once taken — see `composedCaptureKey`.
 */
export interface IComposedCaptureStore {
    get(runId: string): Promise<Result<ComposedCapture | null, PageCompositionError>>;
    set(capture: ComposedCapture): Promise<Result<void, PageCompositionError>>;
}

export const ComposedCaptureStore = createAbstraction<IComposedCaptureStore>(
    "PageCompositionPoc/ComposedCaptureStore"
);

export namespace ComposedCaptureStore {
    export type Interface = IComposedCaptureStore;
}

/** Turns a finished run's Assemble output into published Website Builder pages. */
export interface IComposePagesService {
    execute(runId: string): Promise<Result<ComposePagesResult, PageCompositionError>>;
}

export const ComposePagesService = createAbstraction<IComposePagesService>(
    "PageCompositionPoc/ComposePagesService"
);

export namespace ComposePagesService {
    export type Interface = IComposePagesService;
}
