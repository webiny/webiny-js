import React from "react";
import { Icon } from "@webiny/admin-ui";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { REVIEW_TILE_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { REVIEW_TILE_ICON_COLORS } from "../../targetReview/components/reviewBarAppearance.js";
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

// The 32px state circle of a timeline step (design: Review details).
export const ReviewStepCircle = ({ state, running }: ReviewStepCircleProps) => {
    let tile = STEP_TILES[state];
    if (running) {
        tile = "progress_activity";
    }
    const TileIcon = REVIEW_TILE_ICONS[tile];

    return (
        <div data-role={"step-circle"} className={"flex shrink-0 items-center justify-center"}>
            <Icon
                icon={<TileIcon />}
                label={""}
                size={"lg"}
                color={REVIEW_TILE_ICON_COLORS[tile]}
            />
        </div>
    );
};
