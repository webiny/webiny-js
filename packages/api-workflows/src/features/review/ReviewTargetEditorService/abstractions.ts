import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewTargetEditorError } from "~/domain/review/errors.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "~/features/review/ReviewTargetEditor/abstractions.js";

export interface IReviewTargetEditorService {
    /** Reads through the last registered editor that handles `params.model`. */
    read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>>;
    /** Writes through the last registered editor that handles `params.model`. */
    update(
        params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>>;
}

/**
 * Picks the target editor for a namespace (spec 9.3). Internal (D132): no permission checks, no
 * stale check and no bypass; the AI tools that call it own those (R173).
 */
export const ReviewTargetEditorService = createAbstraction<IReviewTargetEditorService>(
    "ReviewTargetEditorService"
);

export namespace ReviewTargetEditorService {
    export type Interface = IReviewTargetEditorService;
}
