import React from "react";
import { List, ListItem } from "@webiny/ui/List";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { PlaceholderElement } from "@webiny/ui-composer/elements/PlaceholderElement";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { MenuFooter, subFooter } from "./Styled";

interface FooterElementConfig extends ElementConfig {
    closeMenu: () => void;
}

export class FooterElement extends Element<FooterElementConfig> {
    private _footerPlaceholder: PlaceholderElement;

    constructor(id: string, config: FooterElementConfig) {
        super(id, config);

        this.toggleGrid(false);

        this._footerPlaceholder = this.addElement(
            new PlaceholderElement("navigation.footer.placeholder")
        );

        new GenericElement("webiny.version", () => {
            return (
                <ListItem ripple={false} className={subFooter}>
                    Webiny v{process.env.REACT_APP_WEBINY_VERSION}
                </ListItem>
            );
        }).moveAfter(this._footerPlaceholder);
    }

    addMenuElement(element: NavigationMenuElement) {
        element.moveBefore(this._footerPlaceholder);
        return element;
    }

    render(props?: any): React.ReactNode {
        return (
            <MenuFooter>
                <List nonInteractive>{super.render(props)}</List>
            </MenuFooter>
        );
    }
}
