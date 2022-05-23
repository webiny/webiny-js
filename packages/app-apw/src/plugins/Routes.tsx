import React, { Suspense, lazy } from "react";
import Helmet from "react-helmet";
import { CircularProgress } from "@webiny/ui/Progress";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { PublishingWorkflowsView } from "~/views/publishingWorkflows";
import { ContentReviewDashboard } from "~/views/contentReviewDashboard";
import { AddRoute } from "@webiny/app-admin";

const ContentReviewEditor = lazy(
    () => import("~/views/contentReviewDashboard/ContentReviewEditor")
);

interface LoaderProps {
    children: React.ReactElement;
}
const Loader: React.FC<LoaderProps> = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

export const Routes: React.FC = () => {
    return (
        <>
            <AddRoute
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
            <AddRoute
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
            <AddRoute
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
        </>
    );
};
