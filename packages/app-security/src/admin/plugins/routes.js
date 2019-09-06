// @flow
import React from "react";
import Helmet from "react-helmet";
import { Route } from "react-router-dom";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { Roles } from "@webiny/app-security/admin/views/Roles";
import { Users } from "@webiny/app-security/admin/views/Users";
import { Groups } from "@webiny/app-security/admin/views/Groups";
import Account from "@webiny/app-security/admin/views/Account";
import { SecureRoute } from "@webiny/app-security/components";

export default [
    {
        name: "route-roles",
        type: "route",
        route: (
            <Route
                exact
                path={"/roles"}
                render={() => (
                    <SecureRoute roles={["security-roles"]}>
                        <AdminLayout>
                            <Helmet title={"Security - Roles"} />
                            <Roles />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-groups",
        type: "route",
        route: (
            <Route
                exact
                path={"/groups"}
                render={() => (
                    <SecureRoute roles={["security-groups"]}>
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
                    <SecureRoute roles={["security-users"]}>
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
