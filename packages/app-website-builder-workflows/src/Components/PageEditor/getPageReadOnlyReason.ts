import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export type PageReadOnlyReasonVm = Pick<TargetReviewPresenter.ViewModel, "status" | "reviewKind">;

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";

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
        // The strip's lock line is the read-only reason in every review state.
        return null;
    }

    if (pageStatus !== WbPageStatus.Draft) {
        return PUBLISHED;
    }

    return null;
}
