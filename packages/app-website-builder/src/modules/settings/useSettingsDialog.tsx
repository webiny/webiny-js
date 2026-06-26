import React from "react";
import { useDialogs } from "@webiny/app-admin";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { WebsiteBuilderSettings } from "./WebsiteBuilderSettings.js";
import { GetSettingsFeature } from "~/features/settings/getSettings/index.js";
import { UpdateSettingsFeature } from "~/features/settings/updateSettings/index.js";

export const useSettingsDialog = () => {
    const { showSuccessToast } = useToast();
    const dialogs = useDialogs();
    const { useCase: getSettings } = useFeature(GetSettingsFeature);
    const { useCase: updateSettings } = useFeature(UpdateSettingsFeature);

    type SettingsType = Awaited<ReturnType<typeof getSettings.execute>>;

    const showSettingsDialog = () => {
        dialogs.showDialog({
            formData: () => getSettings.execute(),
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
