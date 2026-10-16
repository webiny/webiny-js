import React from "react";
import { Button } from "@webiny/admin-ui";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { ReviewTooltip } from "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js";
import { ReactComponent as PublishIcon } from "@webiny/icons/publish.svg";

export interface DisabledPublishButtonProps {
    presenter: TargetReviewPresenter.Interface;
}

/*
 * A disabled Publish that stays focusable (QBZ-36): `aria-disabled` instead of the `disabled`
 * attribute and no click handler. The shared `ReviewTooltip` gives it the reason on hover and
 * focus and through `aria-describedby`.
 */
export const DisabledPublishButton = ({ presenter }: DisabledPublishButtonProps) => {
    return (
        <ReviewTooltip presenter={presenter}>
            {describedBy => (
                <Button
                    type={"button"}
                    variant={"primary"}
                    text={"Publish"}
                    icon={<PublishIcon />}
                    aria-disabled={"true"}
                    aria-describedby={describedBy}
                />
            )}
        </ReviewTooltip>
    );
};
