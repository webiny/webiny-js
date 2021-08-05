import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MenuIcon } from "~/assets/icons/baseline-menu-24px.svg";
import { MenuGroupRenderer } from "~/plugins/menu/renderers/MenuGroupRenderer";
import { MenuSectionRenderer } from "~/plugins/menu/renderers/MenuSectionRenderer";
import { MenuSectionItemRenderer } from "~/plugins/menu/renderers/MenuSectionItemRenderer";
import { MenuLinkRenderer } from "~/plugins/menu/renderers/MenuLinkRenderer";
import { UIElementPlugin } from "~/ui/UIElement";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { UIViewPlugin } from "~/ui/UIView";
import { NavigationView } from "~/ui/views/NavigationView";

export default [
    new UIViewPlugin<NavigationView>(NavigationView, view => {
        view.getHeaderElement().setMenuButton(
            <IconButton icon={<MenuIcon />} onClick={() => view.getNavigationHook().hideMenu()} />
        );
    }),
    new UIElementPlugin<NavigationMenuElement>(NavigationMenuElement, element => {
        element.addRenderer(new MenuGroupRenderer());
        element.addRenderer(new MenuSectionRenderer());
        element.addRenderer(new MenuSectionItemRenderer());
        element.addRenderer(new MenuLinkRenderer());
    })
];
