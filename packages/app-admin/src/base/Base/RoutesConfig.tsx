import React from "react";
import { Dashboard, AdminLayout, NotFound } from "~/index.js";
import { AdminConfig } from "~/config/AdminConfig.js";
import { Routes } from "~/routes.js";
import { FileManager } from "~/index.js";
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
                route={Routes.FileManager}
                element={
                    <AdminLayout title={"File Manager"}>
                        <FileManager overlay={false} show={true} />
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
