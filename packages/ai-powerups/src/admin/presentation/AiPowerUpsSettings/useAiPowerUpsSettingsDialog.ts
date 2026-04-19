import { useOpenDialog } from "@webiny/app-admin";
import { AI_PowerUpS_SETTINGS_DIALOG } from "./AiPowerUpsSettingsDialog.js";

export const useAiPowerUpsSettingsDialog = () => {
    const { openDialog } = useOpenDialog();

    return () => {
        openDialog(AI_PowerUpS_SETTINGS_DIALOG, {});
    };
};
