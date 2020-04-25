import * as React from "react";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import PageBuilderSettings from "./components/PageBuilderSettings";
import GeneralSettings from "./components/generalSettings/GeneralSettings";
import { SecureRoute } from "@webiny/app-security/components";
import { i18n } from "@webiny/app/i18n";
import { getPlugins } from "@webiny/plugins";
import Helmet from "react-helmet";
import { PbMenuSettingsItemPlugin } from "@webiny/app-page-builder/types";
import { RoutePlugin } from "@webiny/app/types";
import { MenuSettingsPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-page-builder/admin/menus");

const ROLE_PB_EDITOR = ["pb:page:crud"];

const plugins = [
    {
        type: "route",
        name: "route-settings-website",
        route: (
            <Route
                path="/settings/page-builder/website"
                render={() => (
                    <AdminLayout>
                        <Helmet title={t`Page Builder - Website Settings`} />
                        <SecureRoute scopes={ROLE_PB_EDITOR}>
                            <PageBuilderSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "route",
        name: "route-settings-general",
        route: (
            <Route
                path="/settings/page-builder/general"
                render={() => (
                    <AdminLayout>
                        <Helmet title={t`Page Builder - General Settings`} />
                        <SecureRoute roles={["pb-settings"]}>
                            <GeneralSettings />
                        </SecureRoute>
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "menu-settings",
        name: "menu-settings-page-builder",
        render({ Section, Item }) {
            return (
                <Section label={t`Page Builder`}>
                    {getPlugins<PbMenuSettingsItemPlugin>("menu-settings-page-builder").map(
                        plugin => (
                            <React.Fragment key={plugin.name + (new Date)}>
                                {plugin.render({ Item })}
                            </React.Fragment>
                        )
                    )}
                </Section>
            );
        }
    } as MenuSettingsPlugin,
    {
        type: "menu-settings-page-builder",
        name: "menu-settings-website",
        render({ Item }) {
            return <Item label={t`Website`} path={"/settings/page-builder/website"} />;
        }
    } as PbMenuSettingsItemPlugin,
    {
        type: "menu-settings-page-builder",
        name: "menu-settings-general",
        render({ Item }) {
            return <Item label={t`General`} path={"/settings/page-builder/general"} />;
        }
    } as PbMenuSettingsItemPlugin
];

export default plugins;
