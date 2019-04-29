// @flow
import React from "react";
import { i18n } from "webiny-app/i18n";
import { registerPlugins, getPlugins } from "webiny-plugins";
import { ReactComponent as SettingsIcon } from "webiny-admin/assets/icons/round-settings-24px.svg";
import type { SettingsPluginType } from "webiny-admin/types";

const t = i18n.namespace("Webiny.Admin.Menus");

const renderPlugins = ({ plugins, Menu }) => {
    return plugins
        .map(sp => {
            if (typeof sp.settings.show === "function" && !sp.settings.show()) {
                return null;
            }
            return (
                <Menu
                    key={sp.name}
                    label={sp.settings.name}
                    route={"/settings" + sp.settings.route.props.path}
                />
            );
        })
        .filter(item => item);
};

export default [
    {
        type: "webiny-init",
        name: "webiny-init-settings",
        callback() {
            // Settings
            // Apps / integrations can register settings plugins and add menu items like the following.
            let settingsPlugins: Array<SettingsPluginType> = getPlugins("settings");

            settingsPlugins.forEach((sp: SettingsPluginType) => {
                registerPlugins({
                    type: "route",
                    name: "route-settings-" + sp.name,
                    route: React.cloneElement(sp.settings.route, {
                        path: "/settings" + sp.settings.route.props.path
                    })
                });
            });

            const sortedSettingsPlugins = {
                apps: settingsPlugins.filter(sp => sp.settings.type === "app"),
                integrations: settingsPlugins.filter(sp => sp.settings.type === "integration"),
                other: settingsPlugins.filter(
                    sp => !["app", "integration"].includes(sp.settings.type)
                )
            };

            registerPlugins({
                type: "menu",
                name: "menu-settings",
                render({ Menu }) {
                    const render = {
                        apps: renderPlugins({ plugins: sortedSettingsPlugins.apps, Menu }),
                        integrations: renderPlugins({
                            plugins: sortedSettingsPlugins.integrations,
                            Menu
                        }),
                        other: renderPlugins({ plugins: sortedSettingsPlugins.other, Menu })
                    };

                    if (render.apps.length || render.integrations.length || render.other.length) {
                        return (
                            <Menu label={t`Settings`} icon={<SettingsIcon />}>
                                {render.apps.length > 0 && (
                                    <Menu label={t`Apps`}>{render.apps}</Menu>
                                )}

                                {render.integrations.length > 0 && (
                                    <Menu label={t`Integrations`}>{render.integrations}</Menu>
                                )}

                                {render.other.length > 0 && (
                                    <Menu label={t`Other`}>{render.other}</Menu>
                                )}
                            </Menu>
                        );
                    }

                    return null;
                }
            });
        }
    }
];
