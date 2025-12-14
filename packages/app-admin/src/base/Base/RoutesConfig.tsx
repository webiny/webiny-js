import React from "react";
import { Dashboard, AdminLayout, NotFound } from "~/index.js";
import { AdminConfig } from "~/config/AdminConfig.js";
import { Routes } from "~/routes.js";
import { FileManagerRenderer } from "~/index.js";
import { FileManager } from "~/index.js";

const { Route } = AdminConfig;

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
                        <FileManager overlay={false} show={true}/>
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
