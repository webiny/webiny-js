import { createAbstraction } from "@webiny/feature/api/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IndexMode } from "./indexMode.js";

export interface IScopeIndexThresholds {
    /* Latest-view rows at which a lean model is promoted. */
    promoteAt: number;
    /* Latest-view rows below which an indexed model is demoted; well below promoteAt. */
    demoteAt: number;
}

export interface IScopeIndexMode {
    getMode(model: CmsModel): Promise<IndexMode>;
    /**
     * Makes a model's search rows indexed: flags existing rows in batches, then lets queries use the
     * indexes. Long-running for big models; run it from a background task.
     */
    promote(model: CmsModel): Promise<void>;
    /**
     * Stops queries from using the indexes, waits until every process has seen that (the mode TTL),
     * then unflags the rows so they leave the indexes.
     */
    demote(model: CmsModel): Promise<void>;
    /* Promotes or demotes a model by its row count. Returns the resulting mode. */
    evaluate(model: CmsModel, thresholds: IScopeIndexThresholds): Promise<IndexMode>;
}

export const ScopeIndexMode = createAbstraction<IScopeIndexMode>("Cms/Pg/ScopeIndexMode");

export namespace ScopeIndexMode {
    export type Interface = IScopeIndexMode;
    export type Thresholds = IScopeIndexThresholds;
}
