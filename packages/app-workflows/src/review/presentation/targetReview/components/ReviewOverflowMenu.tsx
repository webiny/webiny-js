import React from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVertIcon } from "@webiny/icons/more_vert.svg";
import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";
import type { TargetReviewActionKind } from "../abstractions.js";
import type { TargetReviewActionVm } from "../abstractions.js";

export interface ReviewOverflowMenuProps {
    actions: TargetReviewActionVm[];
    disabled?: boolean;
    onSelect: (kind: TargetReviewActionKind, stepId: string | null) => void;
}

// The "More review actions" menu: Cancel review and Reassign, with their icons.
export const ReviewOverflowMenu = (props: ReviewOverflowMenuProps) => {
    const { actions, disabled, onSelect } = props;

    return (
        <DropdownMenu
            trigger={
                <IconButton
                    data-role={"review-overflow-trigger"}
                    aria-label={"More review actions"}
                    icon={<MoreVertIcon />}
                    variant={"ghost"}
                    size={"md"}
                    disabled={disabled}
                />
            }
        >
            {actions.map(action => {
                const ActionIcon = REVIEW_ACTION_ICONS[action.icon];
                return (
                    <DropdownMenu.Item
                        key={action.kind}
                        text={action.label}
                        icon={<ActionIcon />}
                        onClick={() => onSelect(action.kind, action.stepId)}
                    />
                );
            })}
        </DropdownMenu>
    );
};
