// @flow
import * as React from "react";
import GoogleTagManagerSettings from "./components/GoogleTagManagerSettings";
import type { SettingsPluginType } from "webiny-admin/types";
import { hasRoles } from "webiny-app-security";
import { SecureRoute } from "webiny-app-security/components";

const roles = ["cms-settings"];

export default ([
    {
        type: "settings",
        name: "settings-google-tag-manager",
        settings: {
            show: () => hasRoles(roles),
            type: "integration",
            name: "Google Tag Manager",
            component: (
                <SecureRoute roles={roles}>
                    <GoogleTagManagerSettings />
                </SecureRoute>
            ),
            route: {
                name: "Settings.GoogleTagManager",
                path: "/google-tag-manager",
                title: "Google Tag Manager",
                group: undefined
            }
        }
    }
]: Array<SettingsPluginType>);
