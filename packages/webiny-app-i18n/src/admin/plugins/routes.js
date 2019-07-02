// @flow
import React from "react";
import Helmet from "react-helmet";
import { Route } from "react-router-dom";
import { AdminLayout } from "webiny-admin/components/AdminLayout";
import I18NLocales from "webiny-app-i18n/admin/views/I18NLocales";
import { SecureRoute } from "webiny-app-security/components";

export default [
    {
        name: "route-i18n-locales",
        type: "route",
        route: (
            <Route
                exact
                path={"/i18n/locales"}
                render={() => (
                    <SecureRoute i18NLocales={["i18n-locales"]}>
                        <AdminLayout>
                            <Helmet title={"I18N - Locales"} />
                            <I18NLocales />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }
];
