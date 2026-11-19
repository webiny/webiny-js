import React from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as EditNoteIcon } from "@webiny/icons/edit_note.svg";
import { ReactComponent as TimelineIcon } from "@webiny/icons/timeline.svg";
import { ReactComponent as SwapHorizIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as FrontHandIcon } from "@webiny/icons/front_hand.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";

type RowActionKind = ReviewListRowVm["actions"][number]["kind"];

/*
 * The menu order of the design: Start, Take over, Restart, Open content, Open in new window, View
 * details, then Reassign and Cancel review. The three leading actions come before the fixed items.
 */
const LEADING_ORDER: Partial<Record<RowActionKind, number>> = {
    start: 0,
    takeOver: 1,
    restart: 2
};

const TRAILING_ORDER: Partial<Record<RowActionKind, number>> = {
    reassign: 0,
    cancel: 1
};

const MENU_ICONS: Partial<Record<RowActionKind, React.ReactElement>> = {
    start: <PlayArrowIcon />,
    takeOver: <FrontHandIcon />,
    restart: <RefreshIcon />,
    reassign: <SwapHorizIcon />,
    cancel: <BlockIcon />
};

export interface ReviewListRowActionsProps {
    row: ReviewListRowVm;
    presenter: ReviewListPresenter.Interface;
}

/*
 * Every row action sits in the one row menu. A row without a binding (no content URL) has none
 * (R206).
 */
export const ReviewListRowActions = ({ row, presenter }: ReviewListRowActionsProps) => {
    if (row.contentUrl === null) {
        return null;
    }

    const leading = row.actions
        .filter(action => LEADING_ORDER[action.kind] !== undefined)
        .sort((a, b) => (LEADING_ORDER[a.kind] ?? 0) - (LEADING_ORDER[b.kind] ?? 0));
    const trailing = row.actions
        .filter(action => TRAILING_ORDER[action.kind] !== undefined)
        .sort((a, b) => (TRAILING_ORDER[a.kind] ?? 0) - (TRAILING_ORDER[b.kind] ?? 0));
    const contentUrl = row.contentUrl;

    const renderAction = (action: ReviewListRowVm["actions"][number]) => (
        <DropdownMenu.Item
            key={action.kind}
            icon={MENU_ICONS[action.kind]}
            text={action.label}
            onClick={() => presenter.openRowAction(row.reviewId, action.kind, action.stepId)}
        />
    );

    return (
        <div className="flex items-center justify-end gap-xs">
            <DropdownMenu
                align="end"
                side="bottom"
                trigger={
                    <IconButton
                        variant="ghost"
                        aria-label={`Actions for ${row.title}`}
                        title={`Actions for ${row.title}`}
                        icon={<MoreVerticalIcon />}
                    />
                }
            >
                {leading.map(renderAction)}
                <DropdownMenu.Link to={contentUrl} icon={<EditNoteIcon />} text="Open content" />
                <DropdownMenu.Item
                    icon={<OpenInNewIcon />}
                    text="Open in new window"
                    onClick={() => window.open(contentUrl, "_blank", "noopener,noreferrer")}
                />
                <DropdownMenu.Item
                    icon={<TimelineIcon />}
                    text="View details"
                    onClick={() => presenter.openDetails(row.reviewId)}
                />
                {trailing.map(renderAction)}
            </DropdownMenu>
        </div>
    );
};
