import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";

export interface WbPageTargetReadParams {
    /** Namespace id; only `wb.page` has targets here. */
    model: string;
    targetRevisionId: string;
}

export interface WbPageTargetsReadParams {
    /** Namespace id; only `wb.page` has targets here. */
    model: string;
    targetRevisionIds: string[];
}

export interface WbPageTarget {
    /** The CMS page model, for `UpdateEntrySystemUseCase`. */
    model: CmsModel;
    page: WbPage;
}

export interface IWbPageTargetReader {
    /**
     * Reads the page revision. `null` for another namespace or a missing revision; other failures
     * are thrown. No access check: callers decide with `WbPageAccess`.
     */
    read(params: WbPageTargetReadParams): Promise<WbPageTarget | null>;
    /**
     * Reads many page revisions in one batch read, in no particular order. A missing (or trashed)
     * revision is left out; `[]` for another namespace. Other failures are thrown. No access check.
     */
    readMany(params: WbPageTargetsReadParams): Promise<WbPageTarget[]>;
}

/** Loads a page revision for the `wb.page` adapter and wrappers (R47). */
export const WbPageTargetReader = createAbstraction<IWbPageTargetReader>("WbPageTargetReader");

export namespace WbPageTargetReader {
    export type Interface = IWbPageTargetReader;
    export type Params = WbPageTargetReadParams;
    export type ManyParams = WbPageTargetsReadParams;
    export type Target = WbPageTarget;
}
