import React from "react";
import { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useRouter } from "@webiny/app";
import type { Route } from "@webiny/app";
import { ReviewBar } from "~/review/presentation/targetReview/components/ReviewBar.js";
import { ReviewDetailsDrawer } from "~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js";
import type { IEditorReviewSession } from "../abstractions.js";
import type { ReviewBarLayout } from "~/review/presentation/targetReview/components/ReviewBarLayout.js";
import type { ReviewFieldLabels } from "~/review/presentation/reviewDetails/abstractions.js";

export interface EditorReviewBarProps {
    session: IEditorReviewSession;
    reviewsRoute: Route<any>;
    // The content's field labels, passed to Review details for AI issues (RD5).
    fieldLabels?: ReviewFieldLabels;
    // The content type's label ("Article"), passed to Review details for the header.
    contentTypeLabel?: string;
    layout?: ReviewBarLayout;
}

/*
 * What both app editors mount: the review bar of the session's presenter and, on demand, the
 * Review details drawer. The Content Reviews link of the toasts comes from the app's route (A76).
 * The bar's target namespace, from the presenter's view model, routes the bar's dialogs and the
 * drawer (R363).
 */
export const EditorReviewBar = createReactiveComponent(function EditorReviewBar(
    props: EditorReviewBarProps
) {
    const { session, reviewsRoute, fieldLabels, contentTypeLabel, layout } = props;
    const { getLink } = useRouter();
    const [detailsReviewId, setDetailsReviewId] = useState<string | null>(null);
    const { vm } = session.presenter;
    const reviewsUrl = getLink(reviewsRoute);

    return (
        <>
            <ReviewBar
                presenter={session.presenter}
                namespace={vm.namespace}
                reviewsUrl={reviewsUrl}
                layout={layout}
                onOpenDetails={() => setDetailsReviewId(vm.reviewId)}
            />
            {detailsReviewId !== null && (
                <ReviewDetailsDrawer
                    namespace={vm.namespace}
                    reviewId={detailsReviewId}
                    reviewsUrl={reviewsUrl}
                    onClose={() => setDetailsReviewId(null)}
                    onChanged={() => session.presenter.refresh()}
                    fieldLabels={fieldLabels}
                    contentTypeLabel={contentTypeLabel}
                />
            )}
        </>
    );
});
