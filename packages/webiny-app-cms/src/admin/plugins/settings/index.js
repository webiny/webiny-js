// @flow
import * as React from "react";
import CmsSettings from "./components/CmsSettings";
import type { SettingsPluginType } from "webiny-app-admin/types";

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
    }
]: Array<SettingsPluginType>);
