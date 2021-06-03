import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { LocalesView } from "../views/locales";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";

export default new RoutePlugin({
    route: (
        <Route
            exact
            path={"/i18n/locales"}
            render={() => (
                <SecureRoute permission={"i18n.locale"}>
                    <AdminLayout>
                        <Helmet title={"I18N - Locales"} />
                        <LocalesView />
                    </AdminLayout>
                </SecureRoute>
            )}
        />
    )
});
