import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import FormsSettings from "./components/FormsSettings";
import { SettingsPlugin } from "@webiny/app-admin/types";
import { hasRoles } from "@webiny/app-security";
import { SecureRoute } from "@webiny/app-security/components";

const plugin: SettingsPlugin = {
    type: "settings",
    name: "settings-forms",
    settings: {
        show: () => hasRoles(["forms-settings"]),
        type: "app",
        name: "Form Builder",
        route: (
            <Route
                path="/forms"
                render={() => (
                    <AdminLayout>
                        <SecureRoute roles={["forms-settings"]}>
                            <FormsSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    }
};

export default plugin;