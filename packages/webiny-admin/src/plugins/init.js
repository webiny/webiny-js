// @flow
import React from "react";
import { i18n } from "webiny-app/i18n";
import { addPlugin, getPlugins } from "webiny-plugins";
import { ReactComponent as SettingsIcon } from "webiny-admin/assets/icons/round-settings-24px.svg";
import AdminLayout from "webiny-admin/components/Layouts/AdminLayout";
import type { SettingsPluginType } from "webiny-admin/types";

const t = i18n.namespace("Webiny.Admin.Menus");

export default [
    {
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
    }
];
