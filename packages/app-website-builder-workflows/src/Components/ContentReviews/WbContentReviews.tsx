import React from "react";
import { useFeature } from "@webiny/app";
import type { IReviewContentTypesSource } from "@webiny/app-workflows/review/presentation/reviewList/IReviewContentTypesSource.js";
import { ReviewContentReviewsMenu } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsMenu.js";
import { ReviewContentReviewsRoute } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsRoute.js";
import { ReviewDashboardWidgets } from "@webiny/app-workflows/review/mounting/components/ReviewDashboardWidgets.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewFeature } from "~/features/gateway/feature.js";
import { Routes } from "~/routes.js";

const NAMESPACES = [WB_PAGE_APP];

// Pages need nothing loaded: one fixed namespace and no content types.
const CONTENT_TYPES: IReviewContentTypesSource = {
    vm: { loading: false, namespaces: NAMESPACES, options: [] }
};

/*
 * Mounts the shared Content Reviews route, menu item and dashboard widgets for the `wb` app.
 * Pages have no content type: no Content type column and no filter (D113).
 */
export const WbContentReviews = () => {
    const { rowProvider } = useFeature(WbReviewFeature);

    return (
        <>
            <ReviewContentReviewsRoute
                route={Routes.Pages.WorkflowStateList}
                app="wb"
                rowProvider={rowProvider}
                showContentType={false}
                contentTypes={CONTENT_TYPES}
                breadcrumbName="wb.content-reviews"
            />
            <ReviewContentReviewsMenu
                name="workflows.wb.contentReviews"
                route={Routes.Pages.WorkflowStateList}
                parent="wb"
            />
            <ReviewDashboardWidgets
                prefix="wb"
                namespaces={NAMESPACES}
                rowProvider={rowProvider}
                viewAllRoute={Routes.Pages.WorkflowStateList}
            />
        </>
    );
};
