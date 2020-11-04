import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { I18NLocales } from "@webiny/app-i18n/admin/views/I18NLocales";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";

const plugin: RoutePlugin = {
    type: "route",
    route: (
        <Route
            exact
            path={"/i18n/locales"}
            render={() => (
                <SecureRoute permission={"i18n.locale"}>
                    <AdminLayout>
                        <Helmet title={"I18N - Locales"} />
                        <I18NLocales />
                    </AdminLayout>
                </SecureRoute>
            )}
        />
    )
};

export default plugin;
