import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewBarFailedProps {
    presenter: TargetReviewPresenter.Interface;
}

/*
 * A failed load (QBZ-1): the title, the lock text and Try again. A read without access (R225) is a
 * plain message with no retry.
 */
export const ReviewBarFailed = createReactiveComponent(function ReviewBarFailed(
    props: ReviewBarFailedProps
) {
    const { presenter } = props;
    const { vm } = presenter;

    if (vm.failureKind === "noAccess") {
        return (
            <div className={"mx-md my-md"}>
                <Alert type={"info"} variant={"subtle"}>
                    {vm.message}
                </Alert>
            </div>
        );
    }

    return (
        <div className={"mx-md my-md"}>
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={
                    <Alert.Action
                        text={"Try again"}
                        disabled={vm.busy}
                        onClick={() => presenter.refresh()}
                    />
                }
            >
                <div className={"font-semibold"}>{vm.message}</div>
                <div>{vm.lockText}</div>
            </Alert>
        </div>
    );
});
