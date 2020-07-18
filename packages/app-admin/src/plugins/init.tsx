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

        registerPlugins({
            name: "menu-settings",
            type: "admin-menu",
            order: 100,
            render({ Menu, Section, Item }) {    
                const settingsPlugins = getPlugins<AdminMenuSettingsPlugin>("admin-menu-settings");
                
                //retrieves permitted key and value for settingsPlugins and receives data for display
                const renderedSettingsPlugins = settingsPlugins.map(pl => {
                    return {
                        name: pl.name,
                        rendered: pl.render({ Section, Item })
                    }
                });
                
                //set to true, if atleast one settings plugins are permitted for the user
                const canSeeAnySettings = settingsPlugins.some(pl => pl.permitted == true, { forceBoolean: true });
                console.log("canSeeAnySettings::::::");
                console.log(canSeeAnySettings);
                if (canSeeAnySettings) {
                    return (
                        <Menu name="settings" label={t`Settings`} icon={<SettingsIcon />}>
                            {renderedSettingsPlugins.map(plugin => (
                                <React.Fragment key={plugin.name}>
                                    {plugin.rendered}
                                </React.Fragment>
                            ))}
                        </Menu>
                    );
                } else {
                    //returning blank for now, incase other tabs are available in side nav
                    return;
                }
            }
        });
    }
};

export default plugin;
