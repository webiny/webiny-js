import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { WorkflowReviewChangedKind } from "~/domain/notifications/types.js";

export interface ReviewChangeNotifyParams {
    /** The saved review: the namespace and the ids of the frame. */
    review: ReviewData;
    /** The step the change is about; `null` when there is none. */
    stepId: string | null;
    kind: WorkflowReviewChangedKind;
    /** Already filtered by the handler (R254); duplicates are removed by the sender. */
    recipientIds: string[];
}

export interface IReviewChangeNotifierService {
    /**
     * Sends the silent `workflows.reviewChanged` frame (ids and namespace, no text, R253) to the
     * recipients' connections in the current tenant. No recipient: nothing happens. Never
     * rejects and never reports a failure (R87): every failure is logged once.
     */
    notify(params: ReviewChangeNotifyParams): Promise<void>;
}

/** Tells participants that a review changed. Internal (D132): no permission check. */
export const ReviewChangeNotifierService = createAbstraction<IReviewChangeNotifierService>(
    "Workflows/ReviewChangeNotifierService"
);

export namespace ReviewChangeNotifierService {
    export type Interface = IReviewChangeNotifierService;
    export type Params = ReviewChangeNotifyParams;
}
