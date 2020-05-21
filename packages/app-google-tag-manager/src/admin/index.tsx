import * as React from "react";
import { Route } from "@webiny/react-router";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import GoogleTagManagerSettings from "./components/GoogleTagManagerSettings";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { i18n } from "@webiny/app/i18n";
import { PbMenuSettingsItemPlugin } from "@webiny/app-page-builder/types";

const t = i18n.ns("app-google-tag-manager/admin");

const ROLE_PB_SETTINGS = ["pb:page:crud"];

export default () => [
    {
        type: "route",
        name: "route-settings-page-builder-google-tag-manager",
        route: (
            <Route
                path="/settings/page-builder/google-tag-manager"
                render={() => (
                    <AdminLayout>
                        <Helmet title={"Page Builder - Google Tag Manager Settings"} />
                        <SecureRoute scopes={ROLE_PB_SETTINGS}>
                            <GoogleTagManagerSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "menu-settings-page-builder",
        name: "menu-settings-page-builder-google-tag-manager",
        render({ Item }) {
            return (
                <Item
                    label={t`Google Tag Manager`}
                    path="/settings/page-builder/google-tag-manager"
                />
            );
        }
    } as PbMenuSettingsItemPlugin
];
