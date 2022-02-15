import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { Groups } from "~/ui/views/Groups";
import { ApiKeys } from "~/ui/views/ApiKeys";
import { Permission } from "./constants";

const plugins: RoutePlugin[] = [
    {
        name: "route-security-groups",
        type: "route",
        route: (
            <Route
                exact
                path={"/access-management/groups"}
                render={() => (
                    <SecureRoute permission={Permission.Groups}>
                        <AdminLayout>
                            <Helmet title={"Access Management - Groups"} />
                            <Groups />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-security-api-keys",
        type: "route",
        route: (
            <Route
                exact
                path={"/access-management/api-keys"}
                render={() => (
                    <SecureRoute permission={Permission.ApiKeys}>
                        <AdminLayout title={"Access Management - API Keys"}>
                            <ApiKeys />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }
];

export default plugins;
