import React from "react";
import { AdminConfig, useRouter, AdminLayout } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { HasPermission } from "@webiny/app-security";
import installation from "./plugins/installation.js";
import permissionRenderer from "./plugins/permissionRenderer/index.js";
import { FileManagerSettings } from "./views/FileManagerSettings.js";
import { Routes } from "~/routes.js";

const { Menu, Route } = AdminConfig;

export const SettingsModule = () => {
    const { getLink } = useRouter();
    plugins.register(installation, permissionRenderer);

    return (
        <AdminConfig>
            <HasPermission name={"fm.settings"}>
                <Route
                    route={Routes.Settings}
                    element={
                        <AdminLayout title={"File Manager - General Settings"}>
                            <FileManagerSettings />
                        </AdminLayout>
                    }
                />
                <Menu
                    parent={"settings"}
                    name={"settings.fm"}
                    element={<Menu.Group text={"File Manager"} />}
                />
                <Menu
                    parent={"settings"}
                    name={"settings.fm.general"}
                    pinnable={true}
                    element={<Menu.Link text={"General"} to={getLink(Routes.Settings)} />}
                />
            </HasPermission>
        </AdminConfig>
    );
};
