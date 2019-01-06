// @flow
import * as React from "react";
import CookiePolicySettings from "./components/CookiePolicySettings";
import type { SettingsPluginType } from "webiny-admin/types";
import { hasRoles } from "webiny-app-security";
import { SecureRoute } from "webiny-app-security/components";

const roles = ["cms-settings"];

export default ([
    {
        type: "settings",
        name: "settings-cookie-policy",
        settings: {
            show: () => hasRoles(roles),
            type: "integration",
            name: "Cookie Policy",
            component: (
                <SecureRoute roles={roles}>
                    <CookiePolicySettings />
                </SecureRoute>
            ),
            route: {
                name: "Settings.CookiePolicy",
                path: "/cookie-policy",
                title: "Cookie Policy",
                group: undefined
            }
        }
    }
]: Array<SettingsPluginType>);
