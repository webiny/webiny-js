import type { BlockingReviewDto } from "./dto.js";
import type { BlockingReview } from "~/review/domain/types.js";

// Maps a `WorkflowsBlockingReview` (R265): the review in progress that blocks a bulk trash.
export const mapBlockingReview = (dto: BlockingReviewDto): BlockingReview => {
    return {
        reviewId: dto.reviewId,
        model: dto.model,
        targetId: dto.targetId,
        targetRevisionId: dto.targetRevisionId,
        title: dto.title,
        stepPosition: dto.stepPosition,
        stepCount: dto.stepCount,
        stepName: dto.stepName
    };
};
