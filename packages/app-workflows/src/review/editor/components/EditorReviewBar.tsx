import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useRouter } from "@webiny/app";
import type { Route } from "@webiny/app";
import { ReviewBar } from "~/review/presentation/targetReview/components/ReviewBar.js";
import { ReviewDetailsDrawer } from "~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js";
import type { IEditorReviewSession } from "../abstractions.js";
import { useReviewDetailsLinkParam } from "../useReviewDetailsLinkParam.js";
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
 * drawer (R363). A notification's review details link (`reviewId` in the URL) opens the drawer
 * once the bar knows its namespace; closing it removes the param.
 */
export const EditorReviewBar = createReactiveComponent(function EditorReviewBar(
    props: EditorReviewBarProps
) {
    const { session, reviewsRoute, fieldLabels, contentTypeLabel, layout } = props;
    const { getLink } = useRouter();
    const [detailsReviewId, setDetailsReviewId] = useState<string | null>(null);
    const linkParam = useReviewDetailsLinkParam();
    const linkHandled = useRef(false);
    const { vm } = session.presenter;
    const reviewsUrl = getLink(reviewsRoute);
    const namespace = vm.namespace;

    // The drawer runs on the namespace, which the presenter knows once the editor started it.
    useEffect(() => {
        if (linkHandled.current || linkParam.reviewId === null || namespace === "") {
            return;
        }
        linkHandled.current = true;
        setDetailsReviewId(linkParam.reviewId);
    }, [linkParam.reviewId, namespace]);

    const closeDetails = () => {
        setDetailsReviewId(null);
        linkParam.clear();
    };

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
                    onClose={closeDetails}
                    onChanged={() => session.presenter.refresh()}
                    fieldLabels={fieldLabels}
                    contentTypeLabel={contentTypeLabel}
                />
            )}
        </>
    );
});
