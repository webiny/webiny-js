import * as React from "react";
import { CmsEditorFormSettingsPlugin } from "@webiny/app-headless-cms/types";
import GeneralSettings from "./components/GeneralSettings";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";

const plugin: CmsEditorFormSettingsPlugin = {
    name: "content-model-editor-form-settings-general",
    type: "content-model-editor-form-settings",
    title: "General settings",
    description: "Manage content model's name and description.",
    icon: <SettingsIcon />,
    render(props) {
        return <GeneralSettings {...props} />;
    }
};

export default plugin;
