import * as React from "react";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/round/settings.svg";
import { CmsEditorModelSettingsPlugin } from "~/types";
import { GeneralSettings } from "./GeneralSettings";

export const generalSettingsPlugin: CmsEditorModelSettingsPlugin = {
    name: "cms-editor-form-settings-general",
    type: "cms-editor-model-settings",
    title: "General settings",
    description: "Manage content model's name and description.",
    icon: <SettingsIcon />,
    render() {
        return <GeneralSettings />;
    }
};
