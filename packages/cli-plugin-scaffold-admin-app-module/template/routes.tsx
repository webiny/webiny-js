import React, { Suspense, lazy } from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { CircularProgress } from "@webiny/ui/Progress";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";

interface LoaderProps {
    children: React.ReactNode;
    [key: string]: any;
}

/**
 * Registers new "/target-data-models" route.
 */

const Loader = ({ children, ...props }: LoaderProps) => (
    <Suspense fallback={<CircularProgress />}>
        {React.cloneElement(children as unknown as React.ReactElement, props)}
    </Suspense>
);

const TargetDataModels = lazy(() => import("./views"));

export default new RoutePlugin({
    route: (
        <Route
            path={"/target-data-models"}
            exact
            render={() => (
                <AdminLayout>
                    <Helmet>
                        <title>Target Data Models</title>
                    </Helmet>
                    <Loader>
                        <TargetDataModels />
                    </Loader>
                </AdminLayout>
            )}
        />
    )
});
