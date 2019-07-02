// @flow
import * as React from "react";
import GeneralSettings from "./components/GeneralSettings";
import type { FormSettingsPluginType } from "webiny-app-forms/types";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";

export default ([
    {
        name: "form-editor-form-settings-general",
        type: "form-editor-form-settings",
        title: "General settings",
        description: "Manage things like submit success messages and form layout.",
        icon: <SettingsIcon />,
        render(props: Object) {
            return <GeneralSettings {...props} />;
        }
    }
]: Array<FormSettingsPluginType>);
