import React, { Suspense, lazy } from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { CircularProgress } from "@webiny/ui/Progress";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { PublishingWorkflowsView } from "~/views/publishingWorkflows";
import { ContentReviewDashboard } from "~/views/contentReviewDashboard";

const ContentReviewEditor = lazy(
    () => import("~/views/contentReviewDashboard/ContentReviewEditor")
);

const Loader: React.FC<{ children: React.ReactElement }> = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

export default [
    new RoutePlugin({
        route: (
            <Route
                exact
                path={"/apw/publishing-workflows"}
                render={() => (
                    <SecureRoute permission={"apw"}>
                        <AdminLayout>
                            <Helmet title={"APW - Publishing workflows"} />
                            <PublishingWorkflowsView />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }),
    new RoutePlugin({
        route: (
            <Route
                exact
                path={"/apw/content-reviews"}
                render={() => (
                    <SecureRoute permission={"apw"}>
                        <AdminLayout>
                            <Helmet title={"APW - Content reviews"} />
                            <ContentReviewDashboard />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }),
    new RoutePlugin({
        route: (
            <Route
                path={"/apw/content-reviews/:contentReviewId"}
                render={() => (
                    <SecureRoute permission={"apw"}>
                        <Helmet title={"APW - Content review editor"} />
                        <Loader>
                            <ContentReviewEditor />
                        </Loader>
                    </SecureRoute>
                )}
            />
        )
    })
];
