import React from "react";
import { AdminConfig, AdminLayout, RegisterFeature, useRouter } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { GetSettingsFeature } from "~/features/getSettings/feature.js";
import { SaveSettingsFeature } from "~/features/saveSettings/feature.js";
import { SettingsPresenterFeature } from "~/presentation/settings/feature.js";
import { SettingsView } from "~/presentation/settings/components/SettingsView.js";
import { Routes } from "~/routes.js";

const { Menu, Route } = AdminConfig;

export const Extension = () => {
    const router = useRouter();

    return (
        <>
            <RegisterFeature feature={GetSettingsFeature} />
            <RegisterFeature feature={SaveSettingsFeature} />
            <RegisterFeature feature={SettingsPresenterFeature} />
            <AdminConfig>
                <HasPermission name={"mailer.settings"}>
                    <Route
                        route={Routes.Settings}
                        element={
                            <AdminLayout title={"Mailer - Settings"}>
                                <SettingsView />
                            </AdminLayout>
                        }
                    />
                    <Menu
                        name={"mailer.settings"}
                        parent={"settings.system"}
                        element={
                            <Menu.Link
                                text={"Mailer"}
                                to={router.getLink(Routes.Settings)}
                                pinnable={true}
                            />
                        }
                    />
                </HasPermission>
            </AdminConfig>
        </>
    );
};
