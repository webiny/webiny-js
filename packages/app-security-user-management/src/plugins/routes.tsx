import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { Roles } from "../views/Roles";
import { Users } from "../views/Users";
import { Groups } from "../views/Groups";
import Account from "../views/Account";

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
