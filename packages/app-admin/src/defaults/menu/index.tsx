import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MenuIcon } from "~/assets/icons/baseline-menu-24px.svg";
import { MenuGroupRenderer } from "~/defaults/menu/renderers/MenuGroupRenderer";
import { MenuSectionRenderer } from "~/defaults/menu/renderers/MenuSectionRenderer";
import { MenuSectionItemRenderer } from "~/defaults/menu/renderers/MenuSectionItemRenderer";
import { MenuLinkRenderer } from "~/defaults/menu/renderers/MenuLinkRenderer";
import { ElementPlugin } from "@webiny/ui-composer/Element";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ViewPlugin } from "@webiny/ui-composer/View";
import { NavigationView } from "~/views/NavigationView";

export default [
    new ViewPlugin<NavigationView>(NavigationView, view => {
        view.getHeaderElement().setMenuButton(
            <IconButton icon={<MenuIcon />} onClick={() => view.getNavigationHook().hideMenu()} />
        );
    }),
    new ElementPlugin<NavigationMenuElement>(NavigationMenuElement, element => {
        element.addRenderer(new MenuGroupRenderer());
        element.addRenderer(new MenuSectionRenderer());
        element.addRenderer(new MenuSectionItemRenderer());
        element.addRenderer(new MenuLinkRenderer());
    })
];
