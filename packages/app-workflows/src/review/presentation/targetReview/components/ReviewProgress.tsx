import React from "react";
import { ProgressBar } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";

export interface ReviewProgressProps {
    progress: TargetReviewProgressVm;
}

// Row 2 of the bar: the approved share as a bar and "n of N steps approved" as plain text.
export const ReviewProgress = (props: ReviewProgressProps) => {
    const { progress } = props;

    // admin-ui `ProgressBar` reads `value` as a percent and ignores `max`.
    const percent =
        progress.total === 0 ? 0 : Math.round((progress.approved / progress.total) * 100);

    return (
        <div className={"flex w-full items-center gap-sm-plus"}>
            <ProgressBar className={"grow"} value={percent} />
            <Text size={"sm"} className={"shrink-0"}>
                {`${progress.approved} of ${progress.total} steps approved`}
            </Text>
        </div>
    );
};
