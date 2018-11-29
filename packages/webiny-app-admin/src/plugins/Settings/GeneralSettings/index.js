// @flow
import * as React from "react";
import GeneralSettings from "./components/GeneralSettings";
import type { SettingsPluginType } from "webiny-app-admin/types";

export default ({
    type: "settings",
    name: "settings-general-settings",
    settings: {
        type: "other",
        name: "General settings",
        component: <GeneralSettings />,
        route: {
            name: "Settings.GeneralSettings",
            path: "/general",
            title: "General Settings",
            group: undefined
        }
    }
}: SettingsPluginType);
