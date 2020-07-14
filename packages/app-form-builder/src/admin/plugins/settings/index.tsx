import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import FormsSettings from "./components/FormsSettings";
import { SecureRoute, SecureView } from "@webiny/app-security/components";
import Helmet from "react-helmet";
import { RoutePlugin } from "@webiny/app/types";
import { AdminMenuSettingsPlugin } from "@webiny/app-admin/types";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-form-builder/admin/menus");

const ROLE_FORMS_SETTINGS = ["forms:settings"];

const plugins = [
    {
        type: "route",
        name: "route-settings-form-builder",
        scopes: ROLE_FORMS_SETTINGS,
        route: (
            <Route
                path="/settings/form-builder/recaptcha"
                render={() => (
                    <AdminLayout>
                        <Helmet title={t`Form Builder - reCAPTCHA Settings`} />
                        <SecureRoute scopes={ROLE_FORMS_SETTINGS}>
                            <FormsSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "admin-menu-settings",
        name: "menu-settings-form-builder",
        scopes: ROLE_FORMS_SETTINGS,
        render({ Item, Section }) {
            return (
                <SecureView scopes={ROLE_FORMS_SETTINGS}>
                    <Section label={t`Form Builder`}>
                        <Item label={t`reCAPTCHA`} path={"/settings/form-builder/recaptcha"} />
                    </Section>
                </SecureView>
            );
        }
    } as AdminMenuSettingsPlugin
];

export default plugins;
