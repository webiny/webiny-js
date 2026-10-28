import React from "react";
import { ProgressBar } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { ReviewStepsPopover } from "./ReviewStepsPopover.js";

export interface ReviewProgressProps {
    progress: TargetReviewProgressVm;
}

// Row 2 of the bar: the approved share as a bar and "n of N steps approved" (README 6).
export const ReviewProgress = (props: ReviewProgressProps) => {
    const { progress } = props;

    return (
        <div className={"flex items-center gap-sm-plus"}>
            <ProgressBar className={"w-xxl"} value={progress.approved} max={progress.total} />
            <ReviewStepsPopover progress={progress} />
        </div>
    );
};
