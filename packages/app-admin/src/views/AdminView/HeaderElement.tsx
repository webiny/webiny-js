import React from "react";
import { Element } from "@webiny/ui-composer/Element";
import { TopAppBarPrimary, TopAppBarTitle } from "@webiny/ui/TopAppBar";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { PlaceholderElement } from "@webiny/ui-composer/elements/PlaceholderElement";
import { HeaderSectionLeftElement } from "./HeaderSectionLeftElement";
import { HeaderSectionCenterElement } from "./HeaderSectionCenterElement";
import { HeaderSectionRightElement } from "./HeaderSectionRightElement";
import Hamburger from "./components/Hamburger";

enum ElementID {
    MenuButton = "headerMenuButton",
    Logo = "headerLogo"
}

export class HeaderElement extends Element {
    constructor(id: string) {
        super(id);

        this.useGrid(false);

        const leftSection = this.addElement(new HeaderSectionLeftElement("headerLeft"));
        leftSection.addElement(new PlaceholderElement(ElementID.MenuButton));
        leftSection.addElement(new PlaceholderElement(ElementID.Logo));

        this.addElement(new HeaderSectionCenterElement("headerCenter"));
        this.addElement(new HeaderSectionRightElement("headerRight"));

        this.setMenuButton(<Hamburger />);
    }

    getLeftSection(): HeaderSectionLeftElement {
        return this.getElement("headerLeft");
    }

    getCenterSection(): HeaderSectionCenterElement {
        return this.getElement("headerCenter");
    }

    getRightSection(): HeaderSectionRightElement {
        return this.getElement("headerRight");
    }

    setLogo(logo: React.ReactElement) {
        // TODO: extract into a `LogoElement` class
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

    render(props): React.ReactNode {
        return <TopAppBarPrimary fixed>{super.render(props)}</TopAppBarPrimary>;
    }
}
