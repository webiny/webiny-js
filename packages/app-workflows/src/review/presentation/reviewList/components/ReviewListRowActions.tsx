import React from "react";
import { Button } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";

export interface ReviewListRowActionsProps {
    row: ReviewListRowVm;
    presenter: ReviewListPresenter.Interface;
}

/*
 * Start and Take over are buttons in the row, the other actions and Review details sit in the menu.
 * A row without a binding (no content URL) has neither (R206).
 */
export const ReviewListRowActions = ({ row, presenter }: ReviewListRowActionsProps) => {
    if (row.contentUrl === null) {
        return null;
    }

    const inline = row.actions.filter(action => {
        return action.kind === "start" || action.kind === "takeOver";
    });
    const menu = row.actions.filter(action => {
        return action.kind !== "start" && action.kind !== "takeOver";
    });

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
            <a
                href={row.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in new window"
                title="Open in new window"
            >
                <Icon icon={<OpenInNewIcon />} label="Open in new window" size="sm" />
            </a>
            <DropdownMenu
                align="end"
                side="bottom"
                trigger={
                    <IconButton
                        aria-label="More actions"
                        title="More actions"
                        icon={<MoreVerticalIcon />}
                    />
                }
            >
                {menu.map(action => (
                    <DropdownMenu.Item
                        key={action.kind}
                        text={action.label}
                        onClick={() =>
                            presenter.openRowAction(row.reviewId, action.kind, action.stepId)
                        }
                    />
                ))}
                <DropdownMenu.Item
                    text="Review details"
                    onClick={() => presenter.openDetails(row.reviewId)}
                />
            </DropdownMenu>
        </div>
    );
};
