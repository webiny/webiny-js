import React from "react";
import { Button } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as EditNoteIcon } from "@webiny/icons/edit_note.svg";
import { ReactComponent as TimelineIcon } from "@webiny/icons/timeline.svg";
import { ReactComponent as SwapHorizIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";

// The menu order of the design: Open content, View details, then Reassign and Cancel review.
const MENU_ORDER: Partial<Record<ReviewListRowVm["actions"][number]["kind"], number>> = {
    reassign: 0,
    cancel: 1
};

const MENU_ICONS: Partial<Record<ReviewListRowVm["actions"][number]["kind"], React.ReactElement>> =
    {
        reassign: <SwapHorizIcon />,
        cancel: <BlockIcon />
    };

const orderOf = (kind: ReviewListRowVm["actions"][number]["kind"]): number => {
    return MENU_ORDER[kind] ?? Object.keys(MENU_ORDER).length;
};

export interface ReviewListRowActionsProps {
    row: ReviewListRowVm;
    presenter: ReviewListPresenter.Interface;
}

/*
 * Start, Take over and Restart are buttons in the row (Restart is the inline button of the Failed
 * steps tab, QBZ-29, shown on any row whose flags allow it), the other actions and Review details
 * sit in the menu. A row without a binding (no content URL) has neither (R206).
 */
export const ReviewListRowActions = ({ row, presenter }: ReviewListRowActionsProps) => {
    if (row.contentUrl === null) {
        return null;
    }

    const inline = row.actions.filter(action => {
        return action.kind === "start" || action.kind === "takeOver" || action.kind === "restart";
    });
    const menu = row.actions
        .filter(action => {
            return (
                action.kind !== "start" && action.kind !== "takeOver" && action.kind !== "restart"
            );
        })
        .sort((a, b) => orderOf(a.kind) - orderOf(b.kind));
    const contentUrl = row.contentUrl;

    return (
        <div className="flex items-center justify-end gap-xs">
            {inline.map(action => (
                <Button
                    key={action.kind}
                    size="sm"
                    variant="secondary"
                    text={action.label}
                    onClick={() =>
                        presenter.openRowAction(row.reviewId, action.kind, action.stepId)
                    }
                />
            ))}
            <IconButton
                variant="ghost"
                size="sm"
                aria-label="Open in new window"
                title="Open in new window"
                icon={<OpenInNewIcon />}
                onClick={() => window.open(contentUrl, "_blank", "noopener,noreferrer")}
            />
            <DropdownMenu
                align="end"
                side="bottom"
                trigger={
                    <IconButton
                        variant="ghost"
                        aria-label="More actions"
                        title="More actions"
                        icon={<MoreVerticalIcon />}
                    />
                }
            >
                <DropdownMenu.Link to={contentUrl} icon={<EditNoteIcon />} text="Open content" />
                <DropdownMenu.Item
                    icon={<TimelineIcon />}
                    text="View details"
                    onClick={() => presenter.openDetails(row.reviewId)}
                />
                {menu.map(action => (
                    <DropdownMenu.Item
                        key={action.kind}
                        icon={MENU_ICONS[action.kind]}
                        text={action.label}
                        onClick={() =>
                            presenter.openRowAction(row.reviewId, action.kind, action.stepId)
                        }
                    />
                ))}
            </DropdownMenu>
        </div>
    );
};
