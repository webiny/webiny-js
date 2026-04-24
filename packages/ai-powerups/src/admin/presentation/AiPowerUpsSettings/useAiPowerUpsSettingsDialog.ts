import { useOpenDialog } from "@webiny/app-admin";
import { AI_POWER_UPS_SETTINGS_DIALOG } from "./AiPowerUpsSettingsDialog.js";

export const useAiPowerUpsSettingsDialog = () => {
    const { openDialog } = useOpenDialog();

    return () => {
        openDialog(AI_POWER_UPS_SETTINGS_DIALOG, {});
    };
};
