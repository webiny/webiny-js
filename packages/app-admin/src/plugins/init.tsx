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
                
                //renders the settings plugins to receive data for both display and permissions checks
                const renderedSettingsPlugins = settingsPlugins.map(pl => {
                    return {
                        name: pl.name,
                        data: pl.render({ Section, Item })
                    }
                });
                
                console.log("renderedSettingsPlugins:::::::");
                console.log(renderedSettingsPlugins);

                //set to true, if atleast one settings plugins are permitted for the user
                let canSeeAnySettings = renderedSettingsPlugins.some(pl => pl.data.props.permitted == true, { forceBoolean: true });

                if (canSeeAnySettings) {

                    //displays plugin data
                    return (
                        <Menu name="settings" label={t`Settings`} icon={<SettingsIcon />}>
                            {settingsPlugins.map(plugin => (
                                <React.Fragment key={plugin.name}>
                                    {plugin.data}
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
