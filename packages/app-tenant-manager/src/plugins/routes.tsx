import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { TenantsView } from "~/views/tenants";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";

export default new RoutePlugin({
    route: (
        <Route
            exact
            path={"/tenants"}
            render={() => (
                <SecureRoute permission={"tenantManager.tenants"}>
                    <AdminLayout>
                        <Helmet title={"Tenant Manager - Tenants"} />
                        <TenantsView />
                    </AdminLayout>
                </SecureRoute>
            )}
        />
    )
});
