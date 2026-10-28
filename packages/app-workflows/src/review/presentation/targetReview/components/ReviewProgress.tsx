import React from "react";
import { cn } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { REVIEW_SEGMENT_CLASSES } from "./reviewBarAppearance.js";
import { ReviewStepsPopover } from "./ReviewStepsPopover.js";

export interface ReviewProgressProps {
    progress: TargetReviewProgressVm;
}

// Row 2 of the bar: 40x6 segments per step and "n of N steps approved" (README 6).
export const ReviewProgress = (props: ReviewProgressProps) => {
    const { progress } = props;

    return (
        <ReviewStepsPopover progress={progress}>
            <span className={"flex gap-xs"}>
                {progress.segments.map(segment => (
                    <span
                        key={segment.stepId}
                        className={cn(
                            "h-[6px] w-[40px] rounded-full",
                            REVIEW_SEGMENT_CLASSES[segment.state]
                        )}
                    />
                ))}
            </span>
            <Text size={"sm"} className={"text-neutral-muted"}>
                {`${progress.approved} of ${progress.total} steps approved`}
            </Text>
        </ReviewStepsPopover>
    );
};
