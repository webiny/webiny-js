// @flow
import * as React from "react";
import CmsSettings from "./components/CmsSettings";
import GeneralSettings from "./components/generalSettings/GeneralSettings";
import type { SettingsPluginType } from "webiny-admin/types";

export default ([
    {
        type: "settings",
        name: "settings-cms",
        settings: {
            type: "app",
            name: "CMS",
            component: <CmsSettings />,
            route: {
                name: "Settings.Cms",
                path: "/cms",
                title: "CMS",
                group: undefined
            }
        }
    },
    {
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
    }
]: Array<SettingsPluginType>);
