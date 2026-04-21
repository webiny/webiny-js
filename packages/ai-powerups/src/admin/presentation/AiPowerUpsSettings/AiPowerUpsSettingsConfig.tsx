import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import {
    AiPowerUpsSettingsDialog,
    AI_POWER_UPS_SETTINGS_DIALOG
} from "./AiPowerUpsSettingsDialog.js";

export const AiPowerUpsSettingsConfig = () => {
    return (
        <AdminConfig>
            <AdminConfig.Dialog
                name={AI_POWER_UPS_SETTINGS_DIALOG}
                element={<AiPowerUpsSettingsDialog />}
            />
        </AdminConfig>
    );
};
