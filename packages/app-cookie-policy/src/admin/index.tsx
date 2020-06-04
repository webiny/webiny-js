import * as React from "react";
import { Route } from "@webiny/react-router";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import CookiePolicySettings from "./components/CookiePolicySettings";
import { SecureRoute } from "@webiny/app-security/components";
import { i18n } from "@webiny/app/i18n";
import { RoutePlugin } from "@webiny/app/types";
import { PbMenuSettingsItemPlugin } from "@webiny/app-page-builder/types";
const t = i18n.ns("app-cookie-policy/admin");

const ROLE_PB_SETTINGS = ["pb:page:crud"];

export default () => [
    {
        type: "route",
        name: "route-settings-page-builder-cookie-policy",
        route: (
            <Route
                path="/settings/page-builder/cookie-policy"
                render={() => (
                    <AdminLayout>
                        <Helmet title={"Page Builder - Cookie Policy Settings"} />
                        <SecureRoute scopes={ROLE_PB_SETTINGS}>
                            <CookiePolicySettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "menu-settings-page-builder",
        name: "menu-settings-page-builder-cookie-policy",
        render({ Item }) {
            return <Item label={t`Cookie Policy`} path={"/settings/page-builder/cookie-policy"} />;
        }
    } as PbMenuSettingsItemPlugin
];
