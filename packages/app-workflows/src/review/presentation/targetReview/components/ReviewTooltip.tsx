import React from "react";
import { useId } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Tooltip } from "@webiny/admin-ui";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewTooltipProps {
    presenter: TargetReviewPresenter.Interface;
    /*
     * Renders the disabled control. The control itself must carry the `aria-describedby` it is
     * given (undefined when there is no reason), so a screen reader reads the reason from the
     * control and not from a wrapper (QBZ-36).
     */
    children: (describedBy: string | undefined) => React.ReactNode;
}

/*
 * Gives a disabled app control (Publish) its reason on hover and focus (QBZ-36), and describes it
 * through a visually hidden element that is always present while a reason exists. The control
 * stays `aria-disabled` and focusable; the app renders it.
 */
export const ReviewTooltip = createReactiveComponent(function ReviewTooltip(
    props: ReviewTooltipProps
) {
    const { presenter, children } = props;
    const descriptionId = useId();
    const reason = presenter.vm.publishDisabledReason;

    if (reason === null) {
        return <>{children(undefined)}</>;
    }

    return (
        <>
            <Tooltip trigger={children(descriptionId)} content={reason} />
            <span id={descriptionId} className={"sr-only"}>
                {reason}
            </span>
        </>
    );
});
