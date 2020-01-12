import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import PageBuilderSettings from "./components/PageBuilderSettings";
import GeneralSettings from "./components/generalSettings/GeneralSettings";
import { SettingsPlugin } from "@webiny/app-admin/types";
import { hasRoles } from "@webiny/app-security";
import { SecureRoute } from "@webiny/app-security/components";

const plugins: SettingsPlugin[] = [
    {
        type: "settings",
        name: "settings-page-builder",
        settings: {
            show: () => {
                return hasRoles(["pb-settings", "pb-editor"]);
            },
            type: "app",
            name: "Page Builder",
            route: (
                <Route
                    path="/page-builder"
                    render={() => (
                        <AdminLayout>
                            <SecureRoute roles={["pb-settings", "pb-editor"]}>
                                <PageBuilderSettings />
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
                return hasRoles(["pb-settings"]);
            },
            type: "other",
            name: "General settings",
            route: (
                <Route
                    path="/general"
                    render={() => (
                        <AdminLayout>
                            <SecureRoute roles={["pb-settings"]}>
                                <GeneralSettings />
                            </SecureRoute>
                        </AdminLayout>
                    )}
                />
            )
        }
    }
];

export default plugins;
