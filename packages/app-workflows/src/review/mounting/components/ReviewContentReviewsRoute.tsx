import React from "react";
import Helmet from "react-helmet";
import { OverlayLoader } from "@webiny/admin-ui";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { useRoute } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewContentTypeFilter } from "~/review/presentation/reviewList/IReviewContentTypeFilter.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewListView } from "~/review/presentation/reviewList/components/ReviewListView.js";
import { parseReviewListTab } from "~/review/presentation/reviewList/parseReviewListTab.js";

export interface ReviewContentReviewsRouteProps {
    route: Route<any>;
    // The app whose reviews the page lists (R353).
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: IReviewContentTypeFilter | null;
    breadcrumbName: string;
    /*
     * `false` while the app still loads what the list needs (the CMS model list); a loader shows
     * instead of the list.
     */
    ready?: boolean;
}

const ReviewContentReviewsPage = (props: ReviewContentReviewsRouteProps) => {
    const { route, app, rowProvider, namespaces, showContentType, contentTypeFilter } = props;
    const { route: matched } = useRoute(route);
    const tabParam = matched?.params?.tab;
    let tab: ReviewListTab | null = null;
    if (typeof tabParam === "string") {
        tab = parseReviewListTab(tabParam);
    }

    let view: React.ReactNode = <OverlayLoader />;
    if (props.ready ?? true) {
        view = (
            <ReviewListView
                app={app}
                rowProvider={rowProvider}
                namespaces={namespaces}
                showContentType={showContentType}
                contentTypeFilter={contentTypeFilter}
                initialTab={tab ?? undefined}
            />
        );
    }

    return (
        <AdminLayout>
            <Helmet>
                <title>Content Reviews</title>
            </Helmet>
            <AdminConfig.Breadcrumb name={props.breadcrumbName} label="Content Reviews" />
            {view}
        </AdminLayout>
    );
};

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
