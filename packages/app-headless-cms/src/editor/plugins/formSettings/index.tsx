import * as React from "react";
import { FormSettingsPluginType } from "@webiny/app-headless-cms/types";
import GeneralSettings from "./components/GeneralSettings";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";

export default ([
    {
        name: "form-editor-form-settings-general",
        type: "form-editor-form-settings",
        title: "General settings",
        description: "Manage things like submit success messages and form layout.",
        icon: <SettingsIcon />,
        render(props) {
            return <GeneralSettings {...props} />;
        }
    }
] as Array<FormSettingsPluginType>);
