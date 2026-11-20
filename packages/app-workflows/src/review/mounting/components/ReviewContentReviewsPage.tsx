import React from "react";
import Helmet from "react-helmet";
import { OverlayLoader } from "@webiny/admin-ui";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useRoute } from "@webiny/app-admin";
import { ReviewListView } from "~/review/presentation/reviewList/components/ReviewListView.js";
import { parseReviewListScope } from "~/review/presentation/reviewList/parseReviewListScope.js";
import { parseReviewListState } from "~/review/presentation/reviewList/parseReviewListState.js";
import type { ReviewContentReviewsRouteProps } from "./ReviewContentReviewsRoute.js";

// The Content Reviews page of one app; reads the content types live from `contentTypes`.
export const ReviewContentReviewsPage = createReactiveComponent(
    (props: ReviewContentReviewsRouteProps) => {
        const { route, app, rowProvider, showContentType, contentTypes } = props;
        const { route: matched } = useRoute(route);
        // `?scope=` and `?state=`; an invalid value reads as missing, and the list falls back to
        // its default (an unavailable scope or an empty-by-definition pair too).
        const scopeParam = matched?.params?.scope;
        const stateParam = matched?.params?.state;
        const scope = typeof scopeParam === "string" ? parseReviewListScope(scopeParam) : null;
        const state = typeof stateParam === "string" ? parseReviewListState(stateParam) : null;

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
                    initialScope={scope}
                    initialState={state}
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
