// @flow
import React from "react";
import { i18n } from "webiny-app/i18n";
import { addPlugin, getPlugins } from "webiny-plugins";
import plugins from "webiny-app-admin/presets/default";
import { ReactComponent as SecurityIcon } from "./assets/images/icons/baseline-security-24px.svg";
import { ReactComponent as SettingsIcon } from "./assets/images/icons/round-settings-24px.svg";
import Roles from "./views/Roles";
import Users from "./views/Users";
import ApiTokens from "./views/ApiTokens";
import Groups from "./views/Groups";
import Account from "./views/Account";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";
import type { SettingsPluginType } from "webiny-app-admin/types";

const t = i18n.namespace("Admin.App");
const securityManager = "webiny-security-manager";

export default () => {
    addPlugin(...plugins);

    addPlugin({
        type: "webiny-init",
        name: "webiny-init-settings",
        callback() {
            // Settings
            // Apps / integrations can register settings plugins and add menu items like the following.
            let settingsPlugins: Array<SettingsPluginType> = getPlugins("settings");

            settingsPlugins.forEach((sp: SettingsPluginType) => {
                addPlugin({
                    type: "route",
                    name: "route-settings-" + sp.name,
                    route: {
                        ...sp.settings.route,
                        path: "/settings" + sp.settings.route.path,
                        render() {
                            return <AdminLayout>{sp.settings.component}</AdminLayout>;
                        }
                    }
                });
            });

            const sortedSettingsPlugins = {
                apps: settingsPlugins.filter(sp => sp.settings.type === "app"),
                integrations: settingsPlugins.filter(sp => sp.settings.type === "integration"),
                other: settingsPlugins.filter(
                    sp => !["app", "integration"].includes(sp.settings.type)
                )
            };

            addPlugin({
                type: "menu",
                name: "menu-settings",
                render({ Menu }) {
                    return (
                        <Menu label={t`Settings`} icon={<SettingsIcon />}>
                            {sortedSettingsPlugins.apps.length > 0 && (
                                <Menu label={t`Apps`}>
                                    {sortedSettingsPlugins.apps.map(sp => (
                                        <Menu
                                            key={sp.name}
                                            label={sp.settings.name}
                                            route={sp.settings.route.name}
                                        />
                                    ))}
                                </Menu>
                            )}

                            {sortedSettingsPlugins.integrations.length > 0 && (
                                <Menu label={t`Integrations`}>
                                    {sortedSettingsPlugins.integrations.map(sp => (
                                        <Menu
                                            key={sp.name}
                                            label={sp.settings.name}
                                            route={sp.settings.route.name}
                                        />
                                    ))}
                                </Menu>
                            )}

                            {sortedSettingsPlugins.other.length > 0 && (
                                <Menu label={t`Other`}>
                                    {sortedSettingsPlugins.other.map(sp => (
                                        <Menu
                                            key={sp.name}
                                            label={sp.settings.name}
                                            route={sp.settings.route.name}
                                        />
                                    ))}
                                </Menu>
                            )}
                        </Menu>
                    );
                }
            });
        }
    });

    // Add menu plugin
    addPlugin({
        name: "security-menu",
        type: "menu",
        render({ Menu }) {
            return (
                <Menu label={t`Security`} icon={<SecurityIcon />}>
                    <Menu label={t`Identities`} group={securityManager}>
                        <Menu label={t`Users`} route="Users" />
                        <Menu label={t`API Tokens`} route="ApiTokens" />
                    </Menu>
                    <Menu label={t`User Management`} group={securityManager}>
                        <Menu label={t`Groups`} route="Groups" />
                        <Menu label={t`Roles`} route="Roles" />
                    </Menu>
                </Menu>
            );
        }
    });

    addPlugin({
        name: "route-roles",
        type: "route",
        route: {
            name: "Roles",
            path: "/roles",
            title: "Security - Roles",
            render() {
                return (
                    <AdminLayout>
                        <Roles />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });

    addPlugin({
        name: "route-groups",
        type: "route",
        route: {
            name: "Groups",
            path: "/groups",
            title: "Security - Groups",
            render() {
                return (
                    <AdminLayout>
                        <Groups />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });

    addPlugin({
        name: "route-users",
        type: "route",
        route: {
            name: "Users",
            path: "/users",
            title: "Security - Users",
            render() {
                return (
                    <AdminLayout>
                        <Users />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });

    addPlugin({
        name: "route-api-tokens",
        type: "route",
        route: {
            name: "ApiTokens",
            path: "/api-tokens",
            title: "Security - Identities - API Tokens",
            render() {
                return (
                    <AdminLayout>
                        <ApiTokens />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });

    addPlugin({
        name: "route-account",
        type: "route",
        route: {
            name: "Account",
            path: "/account",
            title: "Account",
            render() {
                return (
                    <AdminLayout>
                        <Account />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });
};
