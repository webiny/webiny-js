import type { ReviewActionKind } from "./ReviewActionKind.js";
import type { ReviewActionDialogContext } from "./ReviewActionDialogContext.js";

// What a dialog needs: ids and strings only. The dialog loads the review itself (R234).
export interface ReviewActionRequest {
    kind: ReviewActionKind;
    reviewId: string;
    stepId: string | null;
    context: ReviewActionDialogContext;
}
