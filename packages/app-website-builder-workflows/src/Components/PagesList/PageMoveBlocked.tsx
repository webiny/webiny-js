import React, { useId } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { OptionsMenuItem } from "@webiny/app-admin";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { MOVE_BLOCKED_IN_REVIEW } from "@webiny/app-workflows/review/presentation/targetReview/moveBlockedInReview.js";
import { ignoreAction } from "./ignoreAction.js";

/*
 * The row's "Move" shown disabled while the page is in review (the Headless CMS list does the
 * same). A disabled menu item cannot take focus, so the reason is given on hover by the tooltip and
 * to assistive technology by `aria-describedby` on a visually hidden element.
 */
export const PageMoveBlocked = () => {
    const descriptionId = useId();

    return (
        <span aria-describedby={descriptionId}>
            <Tooltip
                content={MOVE_BLOCKED_IN_REVIEW}
                trigger={
                    <OptionsMenuItem
                        icon={<MoveIcon />}
                        label={"Move"}
                        disabled={true}
                        onAction={ignoreAction}
                    />
                }
            />
            <span id={descriptionId} className={"sr-only"}>
                {MOVE_BLOCKED_IN_REVIEW}
            </span>
        </span>
    );
};
