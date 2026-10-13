import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTargetFolderChainParams {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    folderId: string;
}

export interface IReviewTargetFolderChain {
    /** Whether this adapter answers for the namespace. */
    canHandle(model: string): boolean;
    /**
     * The folder and its ancestors, nearest first, as stored now (spec 6: a parent folder can
     * move while a review runs, so routing reads the chain at step reach). Read without
     * folder-level permissions. Throws when the folders cannot be read.
     */
    listFolderChainIds(params: ReviewTargetFolderChainParams): Promise<string[]>;
}

/**
 * The engine's folder lookup for rule conditions (R114). One implementation per namespace,
 * registered by the app adapters (ACO `GetFolderRepository` + `GetAncestorsUseCase`); the last
 * registered match wins. No match while a folder rule needs the chain fails routing, which falls
 * through to the pool (R116).
 */
export const ReviewTargetFolderChain =
    createAbstraction<IReviewTargetFolderChain>("ReviewTargetFolderChain");

export namespace ReviewTargetFolderChain {
    export type Interface = IReviewTargetFolderChain;
    export type Params = ReviewTargetFolderChainParams;
}
