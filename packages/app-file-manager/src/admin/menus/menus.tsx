import * as React from "react";
import { Route } from "@webiny/react-router";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import FileManagerSettings from "../views/FileManagerSettings";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { i18n } from "@webiny/app/i18n";
import { AdminMenuSettingsPlugin } from '@webiny/app-admin/types';

const t = i18n.ns("app-file-manager/admin");

const ROLE_FM_SETTINGS = ["cms:file-manager:crud"];

export default [
    {
        type: "route",
        name: "route-settings-page-builder-file-manager",
        route: (
            <Route
                path="/settings/page-builder/file-manager"
                render={() => (
                    <AdminLayout>
                        <Helmet title={"Headless CMS - File Manager Settings"} />
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
        name: "menu-settings-page-builder-file-manager",
        render({ Item }) {
            return (
                <Item
                    label={t`File Manager`}
                    path="/settings/page-builder/file-manager"
                />
            );
        }
    } as AdminMenuSettingsPlugin
];
