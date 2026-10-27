import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewActionRequest } from "~/review/presentation/actionDialog/ReviewActionRequest.js";
import { ReviewActionDialogs } from "~/review/presentation/actionDialog/components/ReviewActionDialogs.js";
import { ReviewDetailsDrawer } from "~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js";
import type { IReviewRowProvider } from "../abstractions.js";
import type { ReviewListPresenter } from "../abstractions.js";

export interface ReviewListDialogsProps {
    presenter: ReviewListPresenter.Interface;
    rowProvider: IReviewRowProvider;
}

/*
 * Mounts the row action dialog or the details drawer the presenter asks for, on the row's
 * namespace (R353), only for a namespace the row provider binds. The list passes no `reviewsUrl`:
 * it is Content Reviews itself (R214).
 */
export const ReviewListDialogs = createReactiveComponent((props: ReviewListDialogsProps) => {
    const { presenter, rowProvider } = props;
    const dialog = presenter.vm.dialog;
    if (!dialog) {
        return null;
    }

    const binding = rowProvider.getBinding(dialog.namespace);
    if (!binding) {
        return null;
    }

    if (dialog.kind === "details") {
        return (
            <ReviewDetailsDrawer
                namespace={dialog.namespace}
                reviewId={dialog.reviewId}
                reviewsUrl={null}
                onChanged={() => presenter.refresh()}
                onClose={() => presenter.closeDialog()}
            />
        );
    }

    const request: ReviewActionRequest = {
        kind: dialog.kind,
        reviewId: dialog.reviewId,
        stepId: dialog.stepId,
        context: "list"
    };

    return (
        <ReviewActionDialogs
            namespace={dialog.namespace}
            request={request}
            reviewsUrl={null}
            listRefreshed={true}
            onConflict={() => presenter.refresh()}
            onDone={() => presenter.actionDone()}
            onClose={() => presenter.closeDialog()}
        />
    );
});
