import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import FormsSettings from "./components/FormsSettings";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { NavigationMenuElement } from "@webiny/app-admin/elements/NavigationMenuElement";
import { ViewPlugin } from "@webiny/ui-composer/View";
import { NavigationView } from "@webiny/app-admin/views/NavigationView";

const plugins = [
    new RoutePlugin({
        route: (
            <Route
                path="/settings/form-builder/recaptcha"
                render={() => (
                    <AdminLayout title={"Form Builder - reCAPTCHA Settings"}>
                        <SecureRoute permission={"fb.settings"}>
                            <FormsSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    }),
    new ViewPlugin<NavigationView>(NavigationView, async view => {
        await view.isRendered();

        const { identity } = view.getSecurityHook();
        if (!identity.getPermission("fb.settings")) {
            return;
        }

        const formBuilder = view.addSettingsMenuElement(
            new NavigationMenuElement("menu.settings.formBuilder", {
                label: "Form Builder"
            })
        );

        formBuilder.addElement(
            new NavigationMenuElement("menu.settings.formBuilder.recaptcha", {
                label: "reCAPTCHA",
                path: "/settings/form-builder/recaptcha"
            })
        );
    })
];

export default plugins;
