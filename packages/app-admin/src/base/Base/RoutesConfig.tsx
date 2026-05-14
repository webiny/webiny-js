import React from "react";
import { Dashboard } from "~/base/ui/Dashboard.js";
import { AdminLayout } from "~/components/AdminLayout.js";
import { NotFound } from "~/base/ui/NotFound.js";
import { AdminConfig } from "~/config/AdminConfig.js";
import { Routes } from "~/routes.js";
import { Route } from "~/config/AdminConfig/Route.js";
import { FormModelDemo } from "~/features/formModel/demo/FormModelDemo.js";

export const RoutesConfig = React.memo(() => {
    return (
        <AdminConfig>
            <Route
                route={Routes.Dashboard}
                element={
                    <AdminLayout title={"Welcome!"}>
                        <Dashboard />
                    </AdminLayout>
                }
            />

            <Route
                route={Routes.FormModelDemo}
                element={
                    <AdminLayout title={"FormModel Demo"}>
                        <FormModelDemo />
                    </AdminLayout>
                }
            />

            <Route
                route={Routes.CatchAll}
                element={
                    <AdminLayout title={"Not Accessible"}>
                        <NotFound />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
});

RoutesConfig.displayName = "Routes";
