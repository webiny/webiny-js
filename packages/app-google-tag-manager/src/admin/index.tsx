import * as React from "react";
import { Route } from "@webiny/react-router";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import GoogleTagManagerSettings from "./components/GoogleTagManagerSettings";
import { SettingsPlugin } from "@webiny/app-admin/types";
import { hasRoles } from "@webiny/app-security";
import { SecureRoute } from "@webiny/app-security/components";

const roles = ["pb-settings"];

const plugins: SettingsPlugin[] = [
    {
        type: "settings",
        name: "settings-google-tag-manager",
        settings: {
            show: () => hasRoles(roles),
            type: "integration",
            name: "Google Tag Manager",
            route: (
                <Route
                    path="/google-tag-manager"
                    render={() => (
                        <AdminLayout>
                            <Helmet title={"Google Tag Manager"} />
                            <SecureRoute roles={roles}>
                                <GoogleTagManagerSettings />
                            </SecureRoute>
                        </AdminLayout>
                    )}
                />
            )
        }
    }
];

export default plugins;
