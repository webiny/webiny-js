import React from "react";
import { Tooltip } from "@webiny/admin-ui";
import type { ReviewListStateVm } from "../abstractions.js";

export interface ReviewListStateLabelProps {
    state: ReviewListStateVm;
}

/*
 * The label of one review state segment. A disabled state explains itself in a tooltip (B8); the
 * disabled segment ignores the pointer, so the label takes it back to open the tooltip on hover.
 */
export const ReviewListStateLabel = ({ state }: ReviewListStateLabelProps) => {
    if (!state.disabledReason) {
        return <>{state.label}</>;
    }

    return (
        <Tooltip
            trigger={
                <span data-role="review-list-state-disabled" className="pointer-events-auto">
                    {state.label}
                </span>
            }
            content={state.disabledReason}
        />
    );
};
