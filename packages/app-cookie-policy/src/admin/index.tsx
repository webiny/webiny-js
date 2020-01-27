import * as React from "react";
import { Route } from "@webiny/react-router";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import CookiePolicySettings from "./components/CookiePolicySettings";
import { SettingsPlugin } from "@webiny/app-admin/types";
import { hasRoles } from "@webiny/app-security";
import { SecureRoute } from "@webiny/app-security/components";

const roles = ["pb-settings"];

const plugin: SettingsPlugin = {
    type: "settings",
    name: "settings-cookie-policy",
    settings: {
        show: () => hasRoles(roles),
        type: "integration",
        name: "Cookie Policy",
        route: (
            <Route
                path="/cookie-policy"
                render={() => (
                    <AdminLayout>
                        <Helmet title={"Cookie Policy"} />
                        <SecureRoute roles={roles}>
                            <CookiePolicySettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    }
};

export default plugin;
