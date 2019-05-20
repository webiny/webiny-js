// @flow
import * as React from "react";
import { Route } from "react-router-dom";
import { AdminLayout } from "webiny-admin/components/AdminLayout";
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
            route: (
                <Route
                    path="/cms"
                    render={() => (
                        <AdminLayout>
                            <SecureRoute roles={["cms-settings", "cms-editor"]}>
                                <CmsSettings />
                            </SecureRoute>
                        </AdminLayout>
                    )}
                />
            )
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
            route: (
                <Route
                    path="/general"
                    render={() => (
                        <AdminLayout>
                            <SecureRoute roles={["cms-settings"]}>
                                <GeneralSettings />
                            </SecureRoute>
                        </AdminLayout>
                    )}
                />
            )
        }
    }
]: Array<SettingsPluginType>);
