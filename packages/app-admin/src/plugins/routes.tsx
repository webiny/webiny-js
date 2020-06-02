import React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import Helmet from "react-helmet";
import Welcome from "../components/Welcome";

export default [
    {
        name: "route-welcome",
        type: "route",
        route: (
            <Route
                exact
                path={"/"}
                render={() => (
                    <AdminLayout>
                        <Helmet title={"Welcome!"} />
                        <Welcome />
                    </AdminLayout>
                )}
            />
        )
    }
];