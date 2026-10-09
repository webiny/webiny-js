import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ComposedCapture, ComposePagesResult, PageMap } from "~/domain/types.js";
import type { PageCompositionError } from "~/domain/errors.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { PromotedReference } from "~/features/composition/CompositionSource.js";

/**
 * The run's source-URL → page map. On the tenant key-value store, keyed by run id, so this PoC keeps
 * its own state and adds no field to the extraction run's model.
 */
export interface IPageMapStore {
    /**
     * A run's page map in one tenant: without `tenantId`, its composition into the run's own tenant;
     * with it, its composition into that site tenant. Kept apart, so building a site never loses track
     * of the pages the run published in its own tenant (which a later composition there must retire).
     */
    get(runId: string, tenantId?: string): Promise<Result<PageMap | null, PageCompositionError>>;
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

/** Where a composition writes, when it is not the run's own tenant. */
export interface CompositionTarget {
    tenant: Tenant;
    /** The run's components as promoted INTO that tenant: ids are its Library records. */
    promoted: PromotedReference[];
}

/** Turns a finished run's Assemble output into published Website Builder pages. */
export interface IComposePagesService {
    /** Without a target, into the run's own tenant from its Promote output, as before. */
    execute(
        runId: string,
        target?: CompositionTarget
    ): Promise<Result<ComposePagesResult, PageCompositionError>>;
}

export const ComposePagesService = createAbstraction<IComposePagesService>(
    "PageCompositionPoc/ComposePagesService"
);

export namespace ComposePagesService {
    export type Interface = IComposePagesService;
}
