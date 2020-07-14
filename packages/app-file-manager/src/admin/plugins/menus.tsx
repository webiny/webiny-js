import * as React from "react";
import { Route } from "@webiny/react-router";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import FileManagerSettings from "../views/FileManagerSettings";
import { SecureRoute, SecureView } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { i18n } from "@webiny/app/i18n";
import { AdminMenuSettingsPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-file-manager/admin");

const ROLE_FM_SETTINGS = ["files:settings"];

export default [
    {
        type: "route",
        name: "route-file-manager-settings-general",
        scopes: ROLE_FM_SETTINGS,
        route: (
            <Route
                path="/settings/file-manager/general"
                render={() => (
                    <AdminLayout>
                        <Helmet title={"File Manager Settings - General"} />
                        <SecureRoute scopes={ROLE_FM_SETTINGS}>
                            <FileManagerSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "admin-menu-settings",
        name: "menu-file-manager-settings",
        render({ Section, Item }) {
            return (
                <SecureView scopes={ROLE_FM_SETTINGS}>
                    <Section label={t`File Manager`}>
                        <Item label={t`General`} path="/settings/file-manager/general" />
                    </Section>
                </SecureView>
            );
        }
    } as AdminMenuSettingsPlugin
];
