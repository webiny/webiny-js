// @flow
import * as React from "react";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";
import GeneralSettings from "./GeneralSettings";

export default {
    name: "cms-editor-page-settings-general",
    type: "cms-editor-page-settings",
    title: "General settings",
    description: "Manage things like title, page status,url and more.",
    icon: <SettingsIcon />,
    render(props: Object) {
        return <GeneralSettings {...props} />;
    }
};
