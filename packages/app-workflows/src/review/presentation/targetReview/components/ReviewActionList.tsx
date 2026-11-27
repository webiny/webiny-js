import React from "react";
import { Button } from "@webiny/admin-ui";
import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";
import { ReviewDisabledActionButton } from "./ReviewDisabledActionButton.js";
import { ReviewOverflowMenu } from "./ReviewOverflowMenu.js";
import { splitReviewActions } from "../splitReviewActions.js";
import type { TargetReviewActionKind } from "../abstractions.js";
import type { TargetReviewActionVm } from "../abstractions.js";

export interface ReviewActionListProps {
    actions: TargetReviewActionVm[];
    busy?: boolean;
    onSelect: (kind: TargetReviewActionKind, stepId: string | null) => void;
}

/*
 * The actions of the bar and the details drawer footer: a button each, except Cancel review and
 * Reassign, which share one overflow menu that renders only when one of them is available.
 */
export const ReviewActionList = (props: ReviewActionListProps) => {
    const { actions, busy, onSelect } = props;
    const { buttons, menu } = splitReviewActions(actions);

    return (
        <>
            {menu.length > 0 && (
                <ReviewOverflowMenu actions={menu} disabled={busy} onSelect={onSelect} />
            )}
            {buttons.map(action => {
                if (action.disabledReason !== null) {
                    return (
                        <ReviewDisabledActionButton
                            key={action.kind}
                            action={action}
                            reason={action.disabledReason}
                        />
                    );
                }
                const ActionIcon = REVIEW_ACTION_ICONS[action.icon];
                return (
                    <Button
                        key={action.kind}
                        variant={action.emphasis}
                        size={"md"}
                        text={action.label}
                        icon={<ActionIcon />}
                        disabled={busy}
                        onClick={() => onSelect(action.kind, action.stepId)}
                    />
                );
            })}
        </>
    );
};
