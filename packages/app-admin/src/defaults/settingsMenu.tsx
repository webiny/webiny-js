import React, { useEffect } from "react";
import { ReactComponent as SettingsIcon } from "../assets/icons/round-settings-24px.svg";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { GenericElement } from "@webiny/ui-elements/GenericElement";
import { NavigationView } from "~/views/NavigationView";

const MenuLoader = ({ view }: { view: NavigationView }) => {
    useEffect(() => {
        setTimeout(() => {
            const pageBuilder = view.getContentElement().addMenuElement(
                new NavigationMenuElement("navigation.content.pageBuilder", {
                    label: "Page Builder",
                    icon: <SettingsIcon />
                })
            );

            pageBuilder.addElement(
                new NavigationMenuElement("navigation.content.pageBuilder", {
                    label: "Pages"
                })
            )
            view.refresh();
        }, 1500);
    }, []);
    return null;
};

export default new NavigationViewPlugin(view => {
    /**
     * Define top level "Settings" menu.
     */
    const settingsMenu = new NavigationMenuElement("navigation.content.settings", {
        label: "Settings",
        icon: <SettingsIcon />
    });

    view.getContentElement().addMenuElement(settingsMenu);
    view.addElement(
        new GenericElement("headless-cms-menu-loader", () => {
            return <MenuLoader view={view} />;
        })
    );
});
