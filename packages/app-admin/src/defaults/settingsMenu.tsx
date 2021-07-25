import React from "react";
import { ReactComponent as SettingsIcon } from "../assets/icons/round-settings-24px.svg";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";

export default new NavigationViewPlugin(view => {
    /**
     * Define top level "Settings" menu.
     */
    const settingsMenu = new NavigationMenuElement("navigation.content.settings", {
        label: "Settings",
        icon: <SettingsIcon />
    });

    view.getContentElement().addMenuElement(settingsMenu);
});
