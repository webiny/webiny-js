import React from "react";
import { UIElement } from "~/ui/UIElement";
import { TopAppBarPrimary, TopAppBarTitle } from "@webiny/ui/TopAppBar";
import { GenericElement } from "~/ui/elements/GenericElement";
import { PlaceholderElement } from "~/ui/elements/PlaceholderElement";
import { HeaderSectionLeftElement } from "./HeaderSectionLeftElement";
import { HeaderSectionCenterElement } from "./HeaderSectionCenterElement";
import { HeaderSectionRightElement } from "./HeaderSectionRightElement";
import Hamburger from "./components/Hamburger";
import { UIRenderer, UIRenderParams } from "~/ui/UIRenderer";

enum ElementID {
    MenuButton = "headerMenuButton",
    Logo = "headerLogo"
}

class HeaderElementRenderer extends UIRenderer<HeaderElement> {
    public override render({ next }: UIRenderParams<HeaderElement>): React.ReactNode {
        return <TopAppBarPrimary fixed>{next()}</TopAppBarPrimary>;
    }
}

export class HeaderElement extends UIElement {
    public constructor(id: string) {
        super(id);

        this.useGrid(false);

        const leftSection = this.addElement(new HeaderSectionLeftElement("headerLeft"));
        leftSection.addElement(new PlaceholderElement(ElementID.MenuButton));
        leftSection.addElement(new PlaceholderElement(ElementID.Logo));

        this.addElement(new HeaderSectionCenterElement("headerCenter"));
        this.addElement(new HeaderSectionRightElement("headerRight"));

        this.addRenderer(new HeaderElementRenderer());

        this.setMenuButton(<Hamburger />);
        this.applyPlugins(HeaderElement);
    }

    public getLeftSection(): HeaderSectionLeftElement {
        return this.getElement("headerLeft") as HeaderSectionLeftElement;
    }

    public getCenterSection(): HeaderSectionCenterElement {
        return this.getElement("headerCenter") as HeaderSectionCenterElement;
    }

    public getRightSection(): HeaderSectionRightElement {
        return this.getElement("headerRight") as HeaderSectionRightElement;
    }

    public setLogo(logo: React.ReactElement): void {
        // TODO: extract into a `LogoElement` class
        const element = this.getElement(ElementID.Logo);
        if (!element) {
            return;
        }
        element.replaceWith(
            new GenericElement(ElementID.Logo, () => {
                return <TopAppBarTitle>{logo}</TopAppBarTitle>;
            })
        );
    }

    public setMenuButton(menuButton: React.ReactElement): void {
        const button = this.getElement(ElementID.MenuButton);
        if (!button) {
            return;
        }
        button.replaceWith(
            new GenericElement(ElementID.MenuButton, () => {
                return menuButton;
            })
        );
    }
}
