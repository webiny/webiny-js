import React, { Suspense, lazy } from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { RoutePlugin } from "@webiny/app/types";
import { CircularProgress } from "@webiny/ui/Progress";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";

const Loader = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

const Books = lazy(() => import("./views/Books"));

export default (): RoutePlugin => ({
    type: "route",
    name: "route-admin-entities",
    route: (
        <Route
            path={"/entities"}
            exact
            render={() => (
                <AdminLayout>
                    <Helmet>
                        <title>Books</title>
                    </Helmet>
                    <Loader>
                        <Books />
                    </Loader>
                </AdminLayout>
            )}
        />
    )
});
