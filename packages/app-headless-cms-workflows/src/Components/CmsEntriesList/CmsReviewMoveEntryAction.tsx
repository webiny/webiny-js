import React, { useId } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { OptionsMenuItem } from "@webiny/app-admin";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useEntry } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { MOVE_BLOCKED_IN_REVIEW } from "@webiny/app-workflows/review/presentation/targetReview/moveBlockedInReview.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";
import { ignoreAction } from "../ignoreAction.js";

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

/*
 * A disabled menu item cannot take focus, so the reason is given on hover by the tooltip and to
 * assistive technology by `aria-describedby` on a visually hidden element that is always present
 * (the same pattern as the shared `ReviewTooltip`, which needs a review presenter the list does not
 * have).
 */
const MoveBlocked = () => {
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

interface MoveGateProps {
    children?: React.ReactNode;
}

const MoveGate = createReactiveComponent((props: MoveGateProps) => {
    const { entry } = useEntry();
    const meta: ICmsEntryMetaWithReview = entry.meta;

    if (meta.system?.workflow?.reviewState === ReviewState.InProgress) {
        return <MoveBlocked />;
    }

    return <>{props.children}</>;
});

/*
 * Only the per-row "Move" action is gated. Moving by drag and drop and `MoveEntryUseCase` are not
 * gated in 8a (R250, Contract note 2).
 */
export const CmsReviewMoveEntryAction = EntryAction.createDecorator(Original => {
    return function CmsReviewMoveEntryActionDecorator(props) {
        if (props.name !== "move") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<MoveGate>{props.element}</MoveGate>} />;
    };
});
