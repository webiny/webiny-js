// @flow
import * as React from "react";
import CmsSettings from "./components/CmsSettings";
import GeneralSettings from "./components/generalSettings/GeneralSettings";
import type { SettingsPluginType } from "webiny-admin/types";
import { SCOPES_SETTINGS } from "webiny-app-cms";
import { hasScopes } from "webiny-app-security";
import { SecureRoute } from "webiny-app-security/components";

export default ([
    {
        type: "settings",
        name: "settings-cms",
        settings: {
            show: () => {
                return hasScopes(SCOPES_SETTINGS);
            },
            type: "app",
            name: "CMS",
            component: (
                <SecureRoute scopes={SCOPES_SETTINGS}>
                    <CmsSettings />
                </SecureRoute>
            ),
            route: {
                name: "Settings.Cms",
                path: "/cms",
                title: "CMS"
            }
        }
    },
    {
        type: "settings",
        name: "settings-general-settings",
        settings: {
            show: () => {
                return hasScopes(SCOPES_SETTINGS);
            },
            type: "other",
            name: "General settings",
            component: (
                <SecureRoute scopes={SCOPES_SETTINGS}>
                    <GeneralSettings />
                </SecureRoute>
            ),
            route: {
                name: "Settings.GeneralSettings",
                path: "/general",
                title: "General Settings"
            }
        }
    }
]: Array<SettingsPluginType>);
