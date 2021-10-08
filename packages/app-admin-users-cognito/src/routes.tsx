import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { UIViewComponent } from "@webiny/app-admin/ui/UIView";
import { Account } from "~/ui/views/Account";
import { Permission } from "./constants";
import { UsersView } from "~/ui/views/Users/UsersView";

const plugins: RoutePlugin[] = [
    {
        name: "route-security-users",
        type: "route",
        route: (
            <Route
                exact
                path={"/admin-users"}
                render={() => (
                    <SecureRoute permission={Permission.Users}>
                        <UIViewComponent view={new UsersView()} />
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
