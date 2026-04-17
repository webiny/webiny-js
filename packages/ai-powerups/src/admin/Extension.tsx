import React from "react";
import { AdminConfig, RegisterFeature } from "@webiny/app-admin";
import { SettingsFeature } from "./features/settings/index.js";
import {
    AiPowerUpsSettingsFeature,
    AiPowerUpsSettingsConfig,
    useAiPowerUpsSettingsDialog
} from "./presentation/AiPowerUpsSettings/index.js";

const { Menu } = AdminConfig;

const AiPowerUpsMenuItem = () => {
    const openSettings = useAiPowerUpsSettingsDialog();

    return (
        <AdminConfig>
            <Menu
                parent={"settings.system"}
                name="aiPowerUps"
                element={<Menu.Item text="AI PowerUps" onClick={openSettings} />}
            />
        </AdminConfig>
    );
};

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={SettingsFeature} />
            <RegisterFeature feature={AiPowerUpsSettingsFeature} />
            <AiPowerUpsSettingsConfig />
            <AiPowerUpsMenuItem />
        </>
    );
};
