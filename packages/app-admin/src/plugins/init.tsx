import React from "react";
import { i18n } from "@webiny/app/i18n";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { ReactComponent as SettingsIcon } from "@webiny/app-admin/assets/icons/round-settings-24px.svg";
import { WebinyInitPlugin } from "@webiny/app/types";
import { AdminMenuSettingsPlugin } from "@webiny/app-admin/types";

const t = i18n.namespace("app-admin/menus");

const plugin: WebinyInitPlugin = {
    type: "webiny-init",
    name: "webiny-init-settings",
    init() {
        // Settings
        // Apps / integrations can register settings plugins and add menu items like the following.
        const settingsPlugins = getPlugins<AdminMenuSettingsPlugin>("admin-menu-settings");

        registerPlugins({
            name: "menu-settings",
            type: "admin-menu",
            order: 100,
            render({ Menu, Section, Item }) {
                return (
                    <Menu name="settings" label={t`Settings`} icon={<SettingsIcon />}>
                        {settingsPlugins.map(plugin => (
                            <React.Fragment key={plugin.name}>
                                {plugin.render({ Section, Item })}
                            </React.Fragment>
                        ))}
                    </Menu>
                );
            }
        });
    }
};

export default plugin;
