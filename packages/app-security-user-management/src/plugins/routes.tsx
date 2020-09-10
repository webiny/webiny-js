import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { Users } from "../views/Users";
import { Groups } from "../views/Groups";
import { Account } from "../views/Account";

const plugins: RoutePlugin[] = [
    {
        name: "route-groups",
        type: "route",
        route: (
            <Route
                exact
                path={"/groups"}
                render={() => (
                    <SecureRoute permission={"security.group.crud"}>
                        <AdminLayout>
                            <Helmet title={"Security - Groups"} />
                            <Groups />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-users",
        type: "route",
        route: (
            <Route
                exact
                path={"/users"}
                render={() => (
                    <SecureRoute permission={"security.user.crud"}>
                        <AdminLayout>
                            <Helmet title={"Security - Users"} />
                            <Users />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-account",
        type: "route",
        route: (
            <Route
                exact
                path={"/account"}
                render={() => (
                    <AdminLayout>
                        <Helmet title={"User Account"} />
                        <Account />
                    </AdminLayout>
                )}
            />
        )
    }
];

export default plugins;
