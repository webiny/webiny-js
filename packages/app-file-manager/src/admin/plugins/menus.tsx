import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import FileManagerSettings from "../views/FileManagerSettings";
import { SecureRoute } from "@webiny/app-security/components";
import { NavigationViewPlugin } from "@webiny/app-admin/plugins/NavigationViewPlugin";
import {
    NavigationMenuElement,
    NavigationMenuElementConfig
} from "@webiny/app-admin/elements/NavigationMenuElement";
import { NavigationView } from "@webiny/app-admin/views/NavigationView";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";

const PERMISSION_FM_SETTINGS = "fm.settings";

interface ProtectedMenuElementConfig extends NavigationMenuElementConfig {
    permission: string;
}

/**
 * !EXAMPLE!
 * This demonstrates how you can create your sub-classes to expose a nicer public API.
 */
class ProtectedMenuElement extends NavigationMenuElement {
    constructor(id, config: ProtectedMenuElementConfig) {
        if (config.permission) {
            config.shouldRender = () => {
                const { identity } = this.getView<NavigationView>().getSecurityHook();
                return identity.getPermission(PERMISSION_FM_SETTINGS) !== undefined;
            };
        }
        super(id, config);
    }
}

export default [
    new RoutePlugin({
        route: (
            <Route
                path="/settings/file-manager/general"
                render={() => (
                    <SecureRoute permission={PERMISSION_FM_SETTINGS}>
                        <AdminLayout title={"File Manager Settings - General"}>
                            <FileManagerSettings />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }),
    new NavigationViewPlugin(async view => {
        await view.isRendered();

        const { identity } = view.getSecurityHook();
        const hasPermissions = identity.getPermission(PERMISSION_FM_SETTINGS) !== undefined;
        if (!hasPermissions) {
            return;
        }

        const fileManagerSettings = new ProtectedMenuElement("menu.settings.fileManager", {
            label: "File Manager",
            permission: PERMISSION_FM_SETTINGS
        });

        fileManagerSettings.addElement(
            new NavigationMenuElement("menu.settings.fileManager.general", {
                label: "General",
                path: "/settings/file-manager/general"
            })
        );

        view.addSettingsMenuElement(fileManagerSettings);
    })
];
