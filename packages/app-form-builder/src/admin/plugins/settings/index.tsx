import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import FormsSettings from "./components/FormsSettings";
import { SecureRoute } from "@webiny/app-security/components";
import Helmet from "react-helmet";
import { RoutePlugin } from "@webiny/app/types";
import { MenuSettingsPlugin } from "@webiny/app-admin/types";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-form-builder/admin/menus");

const plugins = [
    {
        type: "route",
        name: "route-settings-form-builder",
        route: (
            <Route
                path="/settings/form-builder/recaptcha"
                render={() => (
                    <AdminLayout>
                        <Helmet title={t`Form Builder - reCAPTCHA Settings`} />
                        <SecureRoute roles={["forms-settings"]}>
                            <FormsSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "menu-settings",
        name: "menu-settings-form-builder",
        render({ Item, Section }) {
            return (
                <Section label={t`Form Builder`}>
                    <Item label={t`reCAPTCHA`} path={"/settings/form-builder/recaptcha"} />
                </Section>
            );
        }
    } as MenuSettingsPlugin
];

export default plugins;
