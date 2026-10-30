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

    // admin-ui `ProgressBar` reads `value` as a percent and ignores `max`.
    const percent =
        progress.total === 0 ? 0 : Math.round((progress.approved / progress.total) * 100);

    return (
        <div className={"flex w-full items-center"}>
            <ReviewStepsPopover
                progress={progress}
                bar={<ProgressBar className={"grow"} value={percent} />}
            />
        </div>
    );
};
