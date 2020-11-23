import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { Users } from "../views/Users";
import { Groups } from "../views/Groups";
import { Account } from "../views/Account";

const PERMISSION_SECURITY_GROUPS = "security.group.manage";
const PERMISSION_SECURITY_USERS = "security.user.manage";

const plugins: RoutePlugin[] = [
    {
        name: "route-groups",
        type: "route",
        route: (
            <Route
                exact
                path={"/security/groups"}
                render={() => (
                    <SecureRoute permission={PERMISSION_SECURITY_GROUPS}>
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
                path={"/security/users"}
                render={() => (
                    <SecureRoute permission={PERMISSION_SECURITY_USERS}>
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
