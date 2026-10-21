import React, { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReviewContentReviewsMenu } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsMenu.js";
import { ReviewContentReviewsRoute } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsRoute.js";
import { ReviewDashboardWidgets } from "@webiny/app-workflows/review/mounting/components/ReviewDashboardWidgets.js";
import { CmsReviewFeature } from "~/features/gateway/feature.js";
import { CmsContentReviewsPresenterFeature } from "~/presentation/contentReviews/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared Content Reviews route, menu item and dashboard widgets for the `cms` app.
 * Only the content type list is CMS knowledge (D113, A80); the page reads it live from the
 * presenter and the widgets wait for it (`ready`), so the list starts once with the real namespaces.
 */
export const CmsContentReviews = createReactiveComponent(() => {
    const { presenter } = useFeature(CmsContentReviewsPresenterFeature);
    const { rowProvider } = useFeature(CmsReviewFeature);

    useEffect(() => {
        void presenter.init();
        return () => {
            presenter.dispose();
        };
    }, [presenter]);

    const vm = presenter.vm;
    const ready = !vm.loading;

    return (
        <>
            <ReviewContentReviewsRoute
                route={Routes.ContentEntries.ContentReviews}
                app="cms"
                rowProvider={rowProvider}
                showContentType={true}
                contentTypes={presenter}
                breadcrumbName="cms.content-reviews"
            />
            <ReviewContentReviewsMenu
                name="workflows.cms.contentReviews"
                route={Routes.ContentEntries.ContentReviews}
                parent="headlessCMS"
            />
            <ReviewDashboardWidgets
                prefix="cms"
                namespaces={vm.namespaces}
                rowProvider={rowProvider}
                viewAllRoute={Routes.ContentEntries.ContentReviews}
                ready={ready}
            />
        </>
    );
});
