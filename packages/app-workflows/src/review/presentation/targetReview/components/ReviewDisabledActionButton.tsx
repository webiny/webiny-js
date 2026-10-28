import React from "react";
import { useId } from "react";
import { Button } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";
import type { TargetReviewActionVm } from "../abstractions.js";

export interface ReviewDisabledActionButtonProps {
    action: TargetReviewActionVm;
    reason: string;
}

/*
 * An action the editor cannot offer right now (Request review with unsaved changes). Like the
 * disabled Publish it is `aria-disabled` and focusable with no click handler, so the tooltip shows
 * the reason on hover and focus, and a visually hidden element describes the button.
 */
export const ReviewDisabledActionButton = (props: ReviewDisabledActionButtonProps) => {
    const { action, reason } = props;
    const descriptionId = useId();
    const ActionIcon = REVIEW_ACTION_ICONS[action.icon];

    const button = (
        <Button
            type={"button"}
            variant={action.emphasis}
            size={"md"}
            text={action.label}
            icon={<ActionIcon />}
            aria-disabled={"true"}
            aria-describedby={descriptionId}
        />
    );

    return (
        <>
            <Tooltip trigger={button} content={reason} />
            <span id={descriptionId} className={"sr-only"}>
                {reason}
            </span>
        </>
    );
};
