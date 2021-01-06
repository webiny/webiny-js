import React from "react";
import Helmet from "react-helmet";
// import { SecureRoute } from "@webiny/app-security/components";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/types";
import Playground from "./views/Playground";

const plugins: RoutePlugin[] = [
    {
        name: "route-api-playground",
        type: "route",
        route: (
            <Route
                exact
                path={"/api-playground"}
                render={() => (
                    <AdminLayout>
                        <Helmet>
                            <title>API Playground</title>
                        </Helmet>
                        <Playground />
                    </AdminLayout>
                )}
            />
        )
    }
];

export default plugins;
