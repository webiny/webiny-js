import React from "react";
import { AdminConfig, AdminLayout, RegisterFeature, useRouter } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { SendTestMailFeature } from "~/features/sendTestMail/feature.js";
import { TestMailPresenterFeature } from "~/presentation/testMail/feature.js";
import { SettingsView } from "~/presentation/settings/SettingsView.js";
import { Routes } from "~/routes.js";

const { Menu, Route } = AdminConfig;

export const Extension = () => {
    const router = useRouter();

    return (
        <>
            <RegisterFeature feature={SendTestMailFeature} />
            <RegisterFeature feature={TestMailPresenterFeature} />
            <AdminConfig>
                <HasPermission name={"mailer.settings"}>
                    <Route
                        route={Routes.Settings}
                        element={
                            <AdminLayout title={"Mailer - Settings"}>
                                <AdminConfig.Breadcrumb name={"settings"} label={"Settings"} />
                                <AdminConfig.Breadcrumb name={"mailer"} label={"Mailer"} />
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
