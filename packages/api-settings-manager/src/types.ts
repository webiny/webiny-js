import { SettingsManagerClient } from "@webiny/api-settings-manager/client/SettingsManagerClient";

export type Action = "getSettings" | "saveSettings" | "deleteSettings";

export type Context = {
    settingsManager: SettingsManagerClient;
};
