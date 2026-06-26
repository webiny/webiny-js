import React from "react";
import { useDialogs } from "@webiny/app-admin";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { WebsiteBuilderSettings } from "./WebsiteBuilderSettings.js";
import { useGetWebsiteBuilderSettings } from "~/features/index.js";
import { UpdateSettingsFeature } from "~/features/settings/updateSettings/index.js";

export const useSettingsDialog = () => {
    const { showSuccessToast } = useToast();
    const dialogs = useDialogs();
    const { getSettings } = useGetWebsiteBuilderSettings();
    const { useCase: updateSettings } = useFeature(UpdateSettingsFeature);

    type SettingsType = Awaited<ReturnType<typeof getSettings>>;

    const showSettingsDialog = () => {
        dialogs.showDialog({
            formData: () => getSettings(),
            title: "Website Builder Settings",
            acceptLabel: "Save Settings",
            cancelLabel: "Cancel",
            loadingLabel: "Saving...",
            content: <WebsiteBuilderSettings />,
            onAccept: async data => {
                await updateSettings.execute(data as SettingsType);
                showSuccessToast({
                    title: "Success!",
                    description: "Settings were saved successfully.",
                    duration: 3000
                });
            }
        });
    };

    return { showSettingsDialog };
};
