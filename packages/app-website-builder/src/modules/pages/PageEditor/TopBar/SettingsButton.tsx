import React from "react";
import { toJS, observable } from "mobx";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { useDialogs } from "@webiny/app-admin";
import { SettingsDialogBody } from "./Settings/SettingsDialogBody.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useEditorConfig } from "~/BaseEditor/index.js";

export const SettingsButton = () => {
    const dialogs = useDialogs();
    const editor = useDocumentEditor();
    const { pageSettings } = useEditorConfig();

    const showDialog = () => {
        dialogs.showDialog({
            title: "Page Settings",
            description: "Configure your page settings, SEO and Social metadata.",
            dismissible: false,
            acceptLabel: "Save Settings",
            formData: async () => {
                const document = editor.getDocumentState().read();
                const formData = {
                    properties: document.properties,
                    extensions: document.extensions,
                    metadata: document.metadata
                };
                return structuredClone(toJS(formData));
            },
            content: <SettingsDialogBody pageSettings={pageSettings} />,
            onAccept: data => {
                editor.updateDocument(document => {
                    document.properties = observable(data.properties);
                    document.extensions = observable(data.extensions);
                    document.metadata = observable(data.metadata);
                });
            }
        });
    };

    return (
        <div className={"flex gap-x-sm"}>
            <IconButton
                variant="secondary"
                icon={<SettingsIcon />}
                onClick={showDialog}
            ></IconButton>
        </div>
    );
};
