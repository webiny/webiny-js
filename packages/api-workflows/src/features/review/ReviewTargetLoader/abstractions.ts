import { createAbstraction } from "@webiny/feature/api";
import type { TargetContext } from "~/domain/review/types.js";

export interface ReviewTargetLoadParams {
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface ReviewTarget {
    title: string;
    context: TargetContext;
}

export interface IReviewTargetLoader {
    /** Whether this loader handles the namespace id, e.g. "cms.article" or "wb.page". */
    canLoad(model: string): boolean;
    /** The target revision's title and typed context; `null` when the revision does not exist. */
    load(params: ReviewTargetLoadParams): Promise<ReviewTarget | null>;
}

/**
 * Loads the content under review (spec 9.3). One implementation per namespace, registered by the
 * target adapters in phase 2; 1a ships none.
 */
export const ReviewTargetLoader = createAbstraction<IReviewTargetLoader>("ReviewTargetLoader");

export namespace ReviewTargetLoader {
    export type Interface = IReviewTargetLoader;
    export type LoadParams = ReviewTargetLoadParams;
    export type Target = ReviewTarget;
}
