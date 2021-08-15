import React from "react";
import { UIElement, UIElementConfig } from "~/ui/UIElement";
import { DrawerHeader } from "@webiny/ui/Drawer";
import { GenericElement } from "~/ui/elements/GenericElement";
import { PlaceholderElement } from "~/ui/elements/PlaceholderElement";
import { TopAppBarTitle } from "@webiny/ui/TopAppBar";
import { MenuHeader, navHeader } from "./Styled";

export enum ElementID {
    Logo = "headerLogo",
    MenuButton = "headerMenuButton"
}

interface HeaderElementConfig extends UIElementConfig {
    closeMenu: () => void;
}

export class HeaderElement extends UIElement<HeaderElementConfig> {
    constructor(id: string, config: HeaderElementConfig) {
        super(id, config);

        this.useGrid(false);
        this.addElement(new PlaceholderElement(ElementID.MenuButton));
        this.addElement(new PlaceholderElement(ElementID.Logo));
    }

    setLogo(logo: React.ReactElement) {
        this.getElement(ElementID.Logo).replaceWith(
            new GenericElement(ElementID.Logo, () => {
                return <TopAppBarTitle>{logo}</TopAppBarTitle>;
            })
        );
    }

    setMenuButton(menuButton: React.ReactElement) {
        this.getElement(ElementID.MenuButton).replaceWith(
            new GenericElement(ElementID.MenuButton, () => {
                return menuButton;
            })
        );
    }

    render(props?: any): React.ReactNode {
        return (
            <DrawerHeader className={navHeader}>
                <MenuHeader>{super.render(props)}</MenuHeader>
            </DrawerHeader>
        );
    }
}
