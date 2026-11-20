import React from "react";
import type { ReviewListRowVm } from "../abstractions.js";
import type { TargetReviewTag } from "~/review/presentation/targetReview/abstractions.js";
import { WorkflowStatus } from "~/review/presentation/components/WorkflowStatus.js";

export interface ReviewListWorkflowCellProps {
    row: ReviewListRowVm;
}

export const ReviewListWorkflowCell = ({ row }: ReviewListWorkflowCellProps) => {
    let stepState: TargetReviewTag | null = null;
    if (row.stepStateLabel) {
        stepState = { label: row.stepStateLabel, variant: row.stepStateVariant };
        if (row.stepStateIcon) {
            stepState.icon = row.stepStateIcon;
        }
    }

    return (
        <WorkflowStatus
            step={row.stepTitle}
            stepColor={row.stepColor}
            state={stepState}
            owner={row.ownerLabel}
        />
    );
};
