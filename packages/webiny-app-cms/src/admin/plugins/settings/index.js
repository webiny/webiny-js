// @flow
import * as React from "react";
import CmsSettings from "./components/CmsSettings";
import GeneralSettings from "./components/generalSettings/GeneralSettings";
import type { SettingsPluginType } from "webiny-admin/types";
import { hasRoles } from "webiny-app-security";
import { SecureRoute } from "webiny-app-security/components";

export default ([
    {
        type: "settings",
        name: "settings-cms",
        settings: {
            show: () => {
                return hasRoles(["cms-settings", "cms-editor"]);
            },
            type: "app",
            name: "CMS",
            component: (
                <SecureRoute roles={["cms-settings", "cms-editor"]}>
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
                return hasRoles(["cms-settings"]);
            },
            type: "other",
            name: "General settings",
            component: (
                <SecureRoute roles={["cms-settings"]}>
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
