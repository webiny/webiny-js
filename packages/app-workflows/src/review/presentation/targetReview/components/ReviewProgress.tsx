import React from "react";
import { ProgressBar } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";

export interface ReviewProgressProps {
    progress: TargetReviewProgressVm;
}

// Row 2 of the bar: the approved share as a bar, with "n of N steps approved" as its value label.
export const ReviewProgress = (props: ReviewProgressProps) => {
    const { progress } = props;

    // admin-ui `ProgressBar` reads `value` as a percent.
    const percent =
        progress.total === 0 ? 0 : Math.round((progress.approved / progress.total) * 100);

    const getValueLabel = () => {
        return `${progress.approved} of ${progress.total} steps approved`;
    };

    return (
        <ProgressBar
            aria-label={"Review progress"}
            value={percent}
            valuePosition={"end"}
            getValueLabel={getValueLabel}
        />
    );
};
