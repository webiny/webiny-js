import { MAX_REVIEW_LIST_SCAN, REVIEW_LIST_PAGE_SIZE } from "~/constants.js";
import { ReviewListLimits } from "./ReviewListLimits.js";

class DefaultReviewListLimitsImpl implements ReviewListLimits.Interface {
    readonly pageSize = REVIEW_LIST_PAGE_SIZE;
    readonly maxScan = MAX_REVIEW_LIST_SCAN;
}

export const DefaultReviewListLimits = ReviewListLimits.createImplementation({
    implementation: DefaultReviewListLimitsImpl,
    dependencies: []
});
