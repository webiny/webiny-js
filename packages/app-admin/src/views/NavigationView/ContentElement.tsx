import React from "react";
import sortBy from "lodash/sortBy";
import { Element } from "@webiny/ui-composer/Element";
import { DrawerContent } from "@webiny/ui/Drawer";
import { plugins } from "@webiny/plugins";
import { AdminMenuPlugin } from "~/types";
// import Section from "~/defaults/menu/Navigation/components/Section";
// import Menu from "~/defaults/menu/Navigation/components/Menu";
// import Item from "~/defaults/menu/Navigation/components/Item";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { navContent } from "~/views/NavigationView/Styled";

export class ContentElement extends Element {
    constructor(id: string) {
        super(id);

        this.toggleGrid(false);

        const menuPlugins = plugins.byType<AdminMenuPlugin>("admin-menu");

        // IMPORTANT! The following piece of code is for BACKWARDS COMPATIBILITY purposes only!

        menuPlugins &&
            sortBy(menuPlugins, [p => p.order || 50, p => p.name]).forEach(plugin => {
                // TODO: scaffold an admin module and make sure it renders in the navigation
            });
    }

    addMenuElement(element: NavigationMenuElement) {
        return this.addElement<NavigationMenuElement>(element);
    }

    render(props?: any): React.ReactNode {
        return <DrawerContent className={navContent}>{super.render(props)}</DrawerContent>;
    }
}
