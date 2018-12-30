// @flow
import * as React from "react";
import CookiePolicySettings from "./components/CookiePolicySettings";
import type { SettingsPluginType } from "webiny-admin/types";

export default ([
    {
        type: "settings",
        name: "settings-cookie-policy",
        settings: {
            type: "integration",
            name: "Cookie Policy",
            component: <CookiePolicySettings />,
            route: {
                name: "Settings.CookiePolicy",
                path: "/cookie-policy",
                title: "Cookie Policy",
                group: undefined
            }
        }
    }
]: Array<SettingsPluginType>);
