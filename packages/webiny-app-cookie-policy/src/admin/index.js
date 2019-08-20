// @flow
import * as React from "react";
import { Route } from "react-router-dom";
import { Helmet } from "react-helmet";
import { AdminLayout } from "webiny-admin/components/AdminLayout";
import CookiePolicySettings from "./components/CookiePolicySettings";
import type { SettingsPluginType } from "webiny-admin/types";
import { hasRoles } from "webiny-app-security";
import { SecureRoute } from "webiny-app-security/components";

const roles = ["pb-settings"];

export default ([
    {
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
    }
]: Array<SettingsPluginType>);
