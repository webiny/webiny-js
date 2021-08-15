import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import {
    NavigationMenuElement,
    NavigationMenuElementConfig
} from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import FileManagerSettings from "../views/FileManagerSettings";

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
    new UIViewPlugin<NavigationView>(NavigationView, async view => {
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

        fileManagerSettings.addElement<NavigationMenuElement>(
            new NavigationMenuElement("menu.settings.fileManager.general", {
                label: "General",
                path: "/settings/file-manager/general"
            })
        );

        view.addSettingsMenuElement(fileManagerSettings);
    })
];
