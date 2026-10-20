import React from "react";
import Helmet from "react-helmet";
import { OverlayLoader } from "@webiny/admin-ui";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useRoute } from "@webiny/app-admin";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewListView } from "~/review/presentation/reviewList/components/ReviewListView.js";
import { parseReviewListTab } from "~/review/presentation/reviewList/parseReviewListTab.js";
import type { ReviewContentReviewsRouteProps } from "./ReviewContentReviewsRoute.js";

// The Content Reviews page of one app; reads the content types live from `contentTypes`.
export const ReviewContentReviewsPage = createReactiveComponent(
    (props: ReviewContentReviewsRouteProps) => {
        const { route, app, rowProvider, showContentType, contentTypes } = props;
        const { route: matched } = useRoute(route);
        const tabParam = matched?.params?.tab;
        let tab: ReviewListTab | null = null;
        if (typeof tabParam === "string") {
            tab = parseReviewListTab(tabParam);
        }

        const vm = contentTypes.vm;
        let view: React.ReactNode = <OverlayLoader />;
        if (!vm.loading) {
            view = (
                <ReviewListView
                    app={app}
                    rowProvider={rowProvider}
                    namespaces={vm.namespaces}
                    showContentType={showContentType}
                    contentTypeFilter={showContentType ? { options: vm.options } : null}
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
    }
);
