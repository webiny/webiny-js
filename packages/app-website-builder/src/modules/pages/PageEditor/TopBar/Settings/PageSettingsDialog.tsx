import React, { useEffect } from "react";
import { useDialogs } from "@webiny/app-admin";
import { SettingsDialogBody } from "./SettingsDialogBody.js";
import type { PageSettingsOverlayProps } from "~/modules/pages/PageEditor/TopBar/SettingsButton.js";
import { useEditorConfig } from "~/BaseEditor/index.js";

export const PageSettingsDialog = ({ open, data, onClose, onSave }: PageSettingsOverlayProps) => {
    const dialogs = useDialogs();
    const { pageSettings } = useEditorConfig();

    const showDialog = () => {
        dialogs.showDialog({
            title: "Page Settings",
            description: "Configure your page settings, SEO and Social metadata.",
            dismissible: false,
            acceptLabel: "Save Settings",
            formData: data,
            content: <SettingsDialogBody pageSettings={pageSettings} />,
            onAccept: onSave,
            onClose
        });
    };

    useEffect(() => {
        if (open) {
            showDialog();
        }
    }, [open]);

    return null;
};
