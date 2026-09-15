import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

/**
 * Provides the `fmFile` CMS model for the current request's tenant.
 *
 * Fetching a model is asynchronous and tenant-dependent, which is why this is a provider rather
 * than the model itself: DI resolution is synchronous, so an already-resolved `CmsModel` could only
 * be supplied by a per-request hook running before any consumer (what `FileModelContextualSchema`
 * used to do). Consumers instead `await get()` at the point of use — by which time the tenant is
 * established — and the provider memoizes for the rest of the request.
 */
export interface IFileModelProvider {
    get(): Promise<CmsModel>;
}

export const FileModelProvider = createAbstraction<IFileModelProvider>("FileModelProvider");

export namespace FileModelProvider {
    export type Interface = IFileModelProvider;
}
