import React from "react";
import { AdminConfig, AdminLayout, useRouter, RegisterFeature } from "@webiny/app-admin";
import { AiPowerUpsSettingsFeature } from "./presentation/AiPowerUpsSettings/index.js";
import { AiPowerUpsSettingsPage } from "./presentation/AiPowerUpsSettings/AiPowerUpsSettingsPage.js";
import { WbContentGeneration } from "~/admin/presentation/WbContentGeneration/Extension.js";
import { AiPowerUpsHeadlessFeatures } from "~/admin/features/feature.js";
import { Routes } from "./routes.js";

const { Menu, Route } = AdminConfig;

const AiPowerUpsSettings = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <Route
                route={Routes.Settings}
                element={
                    <AdminLayout title={"AI Power-Ups"}>
                        <AiPowerUpsSettingsPage />
                    </AdminLayout>
                }
            />
            <Menu
                parent={"settings.system"}
                name={"aiPowerUps"}
                element={
                    <Menu.Link
                        text={"AI Power-Ups"}
                        badge={<Menu.Link.Badge text="BETA" />}
                        to={getLink(Routes.Settings)}
                        pinnable={true}
                    />
                }
            />
        </AdminConfig>
    );
};

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={AiPowerUpsHeadlessFeatures} />
            <RegisterFeature feature={AiPowerUpsSettingsFeature} />
            <AiPowerUpsSettings />
            {/* Website Builder Extension */}
            <WbContentGeneration />
        </>
    );
};
