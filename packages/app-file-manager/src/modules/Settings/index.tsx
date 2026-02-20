import React from "react";
import { AdminConfig, useRouter, AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { FileManagerSettings } from "./views/FileManagerSettings.js";
import { Routes } from "~/routes.js";

const { Menu, Route } = AdminConfig;

export const SettingsModule = () => {
    const { getLink } = useRouter();

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
                    element={
                        <Menu.Link text={"General"} to={getLink(Routes.Settings)} pinnable={true} />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
