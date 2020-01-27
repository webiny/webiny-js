import React, { Suspense, lazy } from "react";
import Helmet from "react-helmet";
import { SecureRoute } from "@webiny/app-security/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/types";

const Loader = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

const FormEditor = lazy(() => import("../views/Editor"));
const Forms = lazy(() => import("../views/Forms/Forms"));

const plugins: RoutePlugin[] = [
    {
        name: "route-form-editors-editor",
        type: "route",
        route: (
            <Route
                exact
                path={"/forms/:id"}
                render={() => (
                    <SecureRoute roles={["form-editors-editor"]}>
                        <Helmet>
                            <title>Edit form</title>
                        </Helmet>
                        <Loader>
                            <FormEditor />
                        </Loader>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-form-editors",
        type: "route",
        route: (
            <Route
                exact
                path="/forms"
                render={() => (
                    <SecureRoute roles={["form-editors"]}>
                        <AdminLayout>
                            <Helmet title={"Form Builder"} />
                            <Loader>
                                <Forms />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }
];

export default plugins;