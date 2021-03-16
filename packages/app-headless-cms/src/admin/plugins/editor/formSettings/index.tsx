import * as React from "react";
import { CmsEditorFormSettingsPlugin } from "~/types";
import GeneralSettings from "./components/GeneralSettings";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";

const plugin: CmsEditorFormSettingsPlugin = {
    name: "cms-editor-form-settings-general",
    type: "cms-editor-form-settings",
    title: "General settings",
    description: "Manage content model's name and description.",
    icon: <SettingsIcon />,
    render(props) {
        return <GeneralSettings {...props} />;
    }
};

export default plugin;
