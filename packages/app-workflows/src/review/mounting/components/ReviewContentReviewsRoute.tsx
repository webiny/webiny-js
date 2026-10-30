import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewContentTypesSource } from "~/review/presentation/reviewList/IReviewContentTypesSource.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewContentReviewsPage } from "./ReviewContentReviewsPage.js";

export interface ReviewContentReviewsRouteProps {
    route: Route<any>;
    // The app whose reviews the page lists (R353).
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
    // Shows the Content type column and filter, with the options of `contentTypes` (D113).
    showContentType: boolean;
    /*
     * The namespaces and filter options, read live: the router keeps the element the route was
     * registered with, so a prop change would never reach the page. A loader shows while loading.
     */
    contentTypes: IReviewContentTypesSource;
    breadcrumbName: string;
}

// One Content Reviews route per app over the shared list view (R206).
export const ReviewContentReviewsRoute = (props: ReviewContentReviewsRouteProps) => {
    return (
        <AdminConfig>
            <AdminConfig.Route
                route={props.route}
                element={<ReviewContentReviewsPage {...props} />}
            />
        </AdminConfig>
    );
};
