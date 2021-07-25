import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { ReactComponent as MenuIcon } from "~/assets/icons/baseline-menu-24px.svg";
import { NavigationMenuElementPlugin } from "~/plugins/NavigationMenuElementPlugin";
import { MenuGroupRenderer } from "~/defaults/menu/renderers/MenuGroupRenderer";
import { MenuSectionRenderer } from "~/defaults/menu/renderers/MenuSectionRenderer";
import { MenuSectionItemRenderer } from "~/defaults/menu/renderers/MenuSectionItemRenderer";
import { MenuLinkRenderer } from "~/defaults/menu/renderers/MenuLinkRenderer";

export default [
    new NavigationViewPlugin(view => {
        view.getHeaderElement().setMenuButton(
            <IconButton icon={<MenuIcon />} onClick={() => view.getNavigationHook().hideMenu()} />
        );
    }),
    new NavigationMenuElementPlugin(element => {
        element.addRenderer(new MenuGroupRenderer());
        element.addRenderer(new MenuSectionRenderer());
        element.addRenderer(new MenuSectionItemRenderer());
        element.addRenderer(new MenuLinkRenderer());
    })
];
