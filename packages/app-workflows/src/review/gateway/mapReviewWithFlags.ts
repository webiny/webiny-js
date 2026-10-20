import type { ReviewWithFlagsDto } from "./dto.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { mapReview } from "./mapReview.js";

export const mapReviewWithFlags = (dto: ReviewWithFlagsDto): ReviewWithFlags => {
    return {
        review: mapReview(dto.review),
        flags: {
            canStart: dto.flags.canStart,
            canTakeOver: dto.flags.canTakeOver,
            canApprove: dto.flags.canApprove,
            canReject: dto.flags.canReject,
            canCancel: dto.flags.canCancel,
            canReassign: dto.flags.canReassign,
            canRestart: dto.flags.canRestart
        }
    };
};
