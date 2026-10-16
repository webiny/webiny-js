import type { ReviewListRow } from "~/review/domain/types.js";

// What the table shows of a review changed between two reads (QBZ-86: the row is highlighted).
export const hasRowChanged = (previous: ReviewListRow, next: ReviewListRow): boolean => {
    const previousOwner = previous.owner ? previous.owner.id : null;
    const nextOwner = next.owner ? next.owner.id : null;

    return (
        previous.stepId !== next.stepId ||
        previous.stepState !== next.stepState ||
        previous.reviewState !== next.reviewState ||
        previousOwner !== nextOwner ||
        previous.lastChangedOn !== next.lastChangedOn
    );
};
