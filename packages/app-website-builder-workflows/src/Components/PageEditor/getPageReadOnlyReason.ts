import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export type PageReadOnlyReasonVm = Pick<TargetReviewPresenter.ViewModel, "status" | "reviewKind">;

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";
const IN_REVIEW = "Read-only while this revision is in review.";
const APPROVED =
    "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review.";
const REJECTED = "Read-only: this revision was rejected. Create a new revision to fix it.";

/*
 * The canvas note of the Website Builder design frames (QBZ-23), switched on `vm.status` and
 * `vm.reviewKind` (R240), never on label text.
 */
export function getPageReadOnlyReason(
    vm: PageReadOnlyReasonVm,
    pageStatus: WbStatus
): string | null {
    if (vm.status === "loading" || vm.status === "failed") {
        return NOT_LOADED;
    }

    if (vm.status === "noWorkflow") {
        return null;
    }

    if (pageStatus === WbPageStatus.Published) {
        return PUBLISHED;
    }

    if (vm.status === "active") {
        if (vm.reviewKind === "approved") {
            return APPROVED;
        }
        if (vm.reviewKind === "rejected") {
            return REJECTED;
        }
        return IN_REVIEW;
    }

    if (pageStatus !== WbPageStatus.Draft) {
        return PUBLISHED;
    }

    return null;
}
