import React from "react";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { CmsMenuLoader } from "./menus/CmsMenuLoader";
import { UIViewPlugin } from "@webiny/ui-composer/UIView";
import { NavigationView } from "@webiny/app-admin/views/NavigationView";
// import { NavigationMenuElement } from "@webiny/app-admin/elements/NavigationMenuElement";
// import { ReactComponent as BeenHere } from "~/admin/icons/beenhere.svg";

export default [
    new UIViewPlugin<NavigationView>(NavigationView, view => {
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
