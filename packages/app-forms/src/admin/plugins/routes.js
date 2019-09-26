// @flow
import React, { Suspense, lazy } from "react";
import Helmet from "react-helmet";
import { SecureRoute } from "@webiny/app-security/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { Route } from "react-router-dom";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";

const Loader = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

const FormEditor = lazy(() => import("../views/Editor"));
const Forms = lazy(() => import("@webiny/app-forms/admin/views/Forms/Forms"));

export default [
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
                            <Helmet title={"Forms"} />
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
