import React from "react";
import { AdminConfig, useRouter, AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { SettingsView } from "~/presentation/Settings/components/SettingsView.js";
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
                            <SettingsView />
                        </AdminLayout>
                    }
                />
                <Menu
                    parent={"settings.system"}
                    name={"settings.fm"}
                    element={
                        <Menu.Link
                            text={"File Manager"}
                            to={getLink(Routes.Settings)}
                            pinnable={true}
                        />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
