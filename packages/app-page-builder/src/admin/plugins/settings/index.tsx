import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import PrerenderingSettings from "./components/prerenderingSettings/PrerenderingSettings";
import { SecureRoute } from "@webiny/app-security/components";
import { i18n } from "@webiny/app/i18n";
import Helmet from "react-helmet";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";

const t = i18n.ns("app-page-builder/admin/menus");

const allPlugins = [
    new RoutePlugin({
        route: (
            <Route
                path="/settings/page-builder/prerendering"
                render={() => (
                    <AdminLayout>
                        <Helmet title={t`Page Builder - Prerendering Settings`} />
                        <SecureRoute permission={"pb.settings"}>
                            <PrerenderingSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    })
];

export default allPlugins;
