import React from "react";
import { Icon } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { REVIEW_TILE_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { REVIEW_TILE_CLASSES } from "../../targetReview/components/reviewBarAppearance.js";
import type { TargetReviewTile } from "../../targetReview/abstractions.js";

export interface ReviewStepCircleProps {
    state: StepStateValue;
    // The step runs right now (an AI or automation step): its circle shows the running icon.
    running: boolean;
}

const STEP_TILES: Record<StepStateValue, TargetReviewTile> = {
    [StepState.Pending]: "rule",
    [StepState.Awaiting]: "hourglass_empty",
    [StepState.InReview]: "rate_review",
    [StepState.Approved]: "check_circle",
    [StepState.Rejected]: "cancel",
    [StepState.Failed]: "sync_problem"
};

// The icon colour per tile, next to the background of the tile classes.
const TILE_FILL_CLASSES: Record<TargetReviewTile, string> = {
    rule: "fill-neutral-strong",
    rate_review: "fill-primary",
    progress_activity: "fill-primary",
    hourglass_empty: "fill-warning",
    sync_problem: "fill-destructive",
    check_circle: "fill-success",
    cancel: "fill-destructive"
};

// The 32px state circle of a timeline step (design: Review details).
export const ReviewStepCircle = ({ state, running }: ReviewStepCircleProps) => {
    let tile = STEP_TILES[state];
    if (running) {
        tile = "progress_activity";
    }
    const TileIcon = REVIEW_TILE_ICONS[tile];

    return (
        <div
            data-role={"step-circle"}
            className={cn(
                "flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full",
                REVIEW_TILE_CLASSES[tile],
                TILE_FILL_CLASSES[tile]
            )}
        >
            <Icon icon={<TileIcon />} label={""} size={"md"} />
        </div>
    );
};
