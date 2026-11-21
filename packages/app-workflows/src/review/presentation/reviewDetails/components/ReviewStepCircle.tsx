import React from "react";
import { Icon } from "@webiny/admin-ui";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { REVIEW_TILE_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { REVIEW_TILE_ICON_COLORS } from "../../targetReview/components/reviewBarAppearance.js";
import type { TargetReviewTile } from "../../targetReview/abstractions.js";

export interface ReviewStepCircleProps {
    state: StepStateValue;
    // The step runs right now (an AI or automation step): the icon is the running one.
    running: boolean;
    // The step was cut short by a cancelled review: the neutral icon of a pending step, matching
    // its neutral Cancelled tag, not the icon of the state it stopped in.
    cancelled: boolean;
}

const STEP_TILES: Record<StepStateValue, TargetReviewTile> = {
    [StepState.Pending]: "rule",
    [StepState.Awaiting]: "hourglass_empty",
    [StepState.InReview]: "rate_review",
    [StepState.Approved]: "check_circle",
    [StepState.Rejected]: "cancel",
    [StepState.Failed]: "sync_problem"
};

// The state icon of a step, in the item's icon slot.
export const ReviewStepCircle = ({ state, running, cancelled }: ReviewStepCircleProps) => {
    let tile = STEP_TILES[state];
    if (running) {
        tile = "progress_activity";
    }
    if (cancelled) {
        tile = STEP_TILES[StepState.Pending];
    }
    const TileIcon = REVIEW_TILE_ICONS[tile];

    return (
        <Icon
            data-role={"step-circle"}
            data-tile={tile}
            icon={<TileIcon />}
            label={""}
            size={"lg"}
            color={REVIEW_TILE_ICON_COLORS[tile]}
        />
    );
};
