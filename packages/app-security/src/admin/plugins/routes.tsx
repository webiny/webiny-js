import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { Roles } from "@webiny/app-security/admin/views/Roles";
import { Users } from "@webiny/app-security/admin/views/Users";
import { Groups } from "@webiny/app-security/admin/views/Groups";
import Account from "@webiny/app-security/admin/views/Account";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";

const ROLE_SECURITY_ROLES = ["security:role:crud"];
const ROLE_SECURITY_GROUPS = ["security:group:crud"];
const ROLE_SECURITY_USERS = ["security:user:crud"];

const plugins: RoutePlugin[] = [
    {
        name: "route-roles",
        type: "route",
        route: (
            <Route
                exact
                path={"/roles"}
                render={() => (
                    <SecureRoute scopes={ROLE_SECURITY_ROLES}>
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
                    <SecureRoute scopes={ROLE_SECURITY_GROUPS}>
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
                    <SecureRoute scopes={ROLE_SECURITY_USERS}>
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
