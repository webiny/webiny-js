import type { ReviewListRow } from "~/review/domain/types.js";
import type { TargetReviewTagVariant } from "./abstractions.js";
import { getStepStateTag } from "./getStepStateTag.js";

export interface RowStateTag {
    // The step-state label, or null when the row has no step state.
    label: string | null;
    variant: TargetReviewTagVariant;
}

const NEUTRAL_VARIANT: TargetReviewTagVariant = "neutral-base-outline";

/*
 * The step-state tag of a review list row. A row without a step state has no label and the
 * neutral variant.
 */
export const getRowStateTag = (row: ReviewListRow): RowStateTag => {
    if (!row.stepState) {
        return { label: null, variant: NEUTRAL_VARIANT };
    }
    const tag = getStepStateTag(row.stepState);
    return { label: tag.label, variant: tag.variant };
};
