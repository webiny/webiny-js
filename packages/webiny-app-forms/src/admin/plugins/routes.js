// @flow
import React from "react";
import Helmet from "react-helmet";
import Loadable from "react-loadable";
import { SecureRoute } from "webiny-app-security/components";
import { CircularProgress } from "webiny-ui/Progress";
import { Route } from "react-router-dom";
import { AdminLayout } from "webiny-admin/components/AdminLayout";

const FormEditor = Loadable({
    loader: () => import("../views/Editor"),
    loading: CircularProgress
});

const Forms = Loadable({
    loader: () => import("webiny-app-forms/admin/views/Forms/Forms"),
    loading: CircularProgress
});

export default [
    {
        name: "route-cms-forms-editor",
        type: "route",
        route: (
            <Route
                exact
                path={"/cms/forms/:id"}
                render={() => (
                    <SecureRoute roles={["cms-forms-editor"]}>
                        <Helmet>
                            <title>CMS - Edit form</title>
                        </Helmet>
                        <FormEditor />
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-cms-forms",
        type: "route",
        route: (
            <Route
                exact
                path="/cms/forms"
                render={() => (
                    <SecureRoute roles={["cms-forms"]}>
                        <AdminLayout>
                            <Helmet title={"CMS - Forms"} />
                            <Forms />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }
];
