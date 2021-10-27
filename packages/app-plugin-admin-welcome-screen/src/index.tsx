import React from "react";
import { Helmet } from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import Welcome from "./components/Welcome";

// eslint-disable-next-line react/display-name
export default () => [
    {
        name: "route-root",
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
