import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import PrerenderingSettings from "./components/prerenderingSettings/PrerenderingSettings";
import WebsiteSettings from "./components/websiteSettings/WebsiteSettings";
import { SecureRoute } from "@webiny/app-security/components";
import { i18n } from "@webiny/app/i18n";
import Helmet from "react-helmet";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { NavigationMenuElement } from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";

const t = i18n.ns("app-page-builder/admin/menus");

const allPlugins = [
    new RoutePlugin({
        route: (
            <Route
                path="/settings/page-builder/website"
                render={() => (
                    <AdminLayout title={"Page Builder - Website Settings"}>
                        <SecureRoute permission={"pb.settings"}>
                            <WebsiteSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    }),
    new RoutePlugin({
        route: (
            <Route
                path="/settings/page-builder/prerendering"
                render={() => (
                    <AdminLayout>
                        <Helmet title={t`Page Builder - Prerendering Settings`} />
                        <SecureRoute permission={"pb.settings"}>
                            <PrerenderingSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    }),
    new UIViewPlugin<NavigationView>(NavigationView, async view => {
        await view.isRendered();

        const { identity } = view.getSecurityHook();
        if (!identity.getPermission("pb.settings")) {
            return;
        }

        const pageBuilderMenu = view.addSettingsMenuElement(
            new NavigationMenuElement("menu.settings.pageBuilder", {
                label: "Page Builder"
            })
        );

        pageBuilderMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("menu.settings.pageBuilder.website", {
                label: "Website",
                path: "/settings/page-builder/website"
            })
        );

        pageBuilderMenu.addElement<NavigationMenuElement>(
            new NavigationMenuElement("menu.settings.pageBuilder.prerendering", {
                label: "Prerendering",
                path: "/settings/page-builder/prerendering"
            })
        );
    })
];

export default allPlugins;
