// @flow
import React from "react";
import Helmet from "react-helmet";
import Loadable from "react-loadable";
import { SecureRoute } from "@webiny/app-security/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { Route } from "react-router-dom";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";

const FormEditor = Loadable({
    loader: () => import("../views/Editor"),
    loading: CircularProgress
});

const Forms = Loadable({
    loader: () => import("@webiny/app-forms/admin/views/Forms/Forms"),
    loading: CircularProgress
});

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
                        <FormEditor />
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
                            <Forms />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }
];
