import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

/**
 * Provides the tenant's ACO folder CMS model.
 *
 * A provider rather than the model itself: fetching a model is asynchronous and tenant-dependent,
 * while DI resolution is synchronous — so an already-resolved `CmsModel` could only be supplied by a
 * per-request hook running before every consumer (what `AcoInitializer` used to do). Consumers
 * `await get()` at the point of use.
 */
export interface IFolderModelProvider {
    get(): Promise<CmsModel>;
}

export const FolderModelProvider = createAbstraction<IFolderModelProvider>("FolderModelProvider");

export namespace FolderModelProvider {
    export type Interface = IFolderModelProvider;
}
