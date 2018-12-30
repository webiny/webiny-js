// @flow
import * as React from "react";
import GoogleTagManagerSettings from "./components/GoogleTagManagerSettings";
import type { SettingsPluginType } from "webiny-admin/types";

export default ([
    {
        type: "settings",
        name: "settings-google-tag-manager",
        settings: {
            type: "integration",
            name: "Google Tag Manager",
            component: <GoogleTagManagerSettings />,
            route: {
                name: "Settings.GoogleTagManager",
                path: "/google-tag-manager",
                title: "Google Tag Manager",
                group: undefined
            }
        }
    }
]: Array<SettingsPluginType>);
