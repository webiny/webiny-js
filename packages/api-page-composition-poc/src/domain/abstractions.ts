import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ComposePagesResult, PageMap } from "~/domain/types.js";
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
