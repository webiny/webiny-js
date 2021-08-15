import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { UIViewComponent } from "@webiny/app-admin/ui/UIView";
import { Groups } from "../ui/views/Groups";
import { ApiKeys } from "../ui/views/ApiKeys";
import { Account } from "../ui/views/Account";
import { Permission } from "./constants";
import { UsersView } from "~/ui/views/Users/UsersView";

const plugins: RoutePlugin[] = [
    {
        name: "route-security-groups",
        type: "route",
        route: (
            <Route
                exact
                path={"/security/groups"}
                render={() => (
                    <SecureRoute permission={Permission.Groups}>
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
        name: "route-security-users",
        type: "route",
        route: (
            <Route
                exact
                path={"/security/users"}
                render={() => (
                    <SecureRoute permission={Permission.Users}>
                        <UIViewComponent view={new UsersView()} />
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
                path={"/security/api-keys"}
                render={() => (
                    <SecureRoute permission={Permission.ApiKeys}>
                        <AdminLayout title={"Security - API Keys"}>
                            <ApiKeys />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-security-account",
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
