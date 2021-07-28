import React from "react";
import { NavigationViewPlugin } from "@webiny/app-admin/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "@webiny/app-admin/elements/NavigationMenuElement";

export default [
    new NavigationViewPlugin(async view => {
        await view.isRendered();

        const { identity } = view.getSecurityHook();
        if (!identity.getPermission("i18n.locale")) {
            return;
        }

        const localesMenu = view.addSettingsMenuElement(
            new NavigationMenuElement("languages", {
                label: "Languages"
            })
        );

        localesMenu.addElement(
            new NavigationMenuElement("locales.crud", {
                label: "Locales",
                path: "/i18n/locales"
            })
        );

        // !EXAMPLE!
        // This shows how you can attach your own logic and conditionally show/hide element.
        //
        // localesMenu.addShouldRender(({ next }) => {
        //     // WARNING! Nonsense example :) 
        //     // If label matches, continue with other checks in the chain.
        
        //     if (localesMenu.config.label === "Locales") {
        //         return next();
        //     }
        //
        //     // Hide otherwise.
        //     return false;
        // });
    })
];
