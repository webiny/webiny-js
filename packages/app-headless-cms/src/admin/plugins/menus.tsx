import React from "react";
import { NavigationViewPlugin } from "@webiny/app-admin/plugins/NavigationViewPlugin";
import { GenericElement } from "@webiny/ui-elements/GenericElement";
import { CmsMenuLoader } from "./menus/CmsMenuLoader";
// import { NavigationMenuElement } from "@webiny/app-admin/elements/NavigationMenuElement";
// import { ReactComponent as BeenHere } from "~/admin/icons/beenhere.svg";

export default [
    new NavigationViewPlugin(view => {
        view.addElement(
            new GenericElement("headlessCms.menuLoader", () => {
                return <CmsMenuLoader view={view} />;
            })
        );

        // !EXAMPLE!
        // This shows how you can move dynamically generated CMS menu items around and place them anywhere in the menu.
        
        // view.awaitElement<NavigationMenuElement>("advancedTopic").then(element => {
        //     element.setIcon(<BeenHere />);
        //     element.moveBefore(view.getElement("headlessCms.mainMenu"));
        // });
    })
];
