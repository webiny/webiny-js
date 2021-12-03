import React from "react";
import { List, ListItem } from "@webiny/ui/List";
import { UIElement, UIElementConfig } from "~/ui/UIElement";
import { GenericElement } from "~/ui/elements/GenericElement";
import { PlaceholderElement } from "~/ui/elements/PlaceholderElement";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { MenuFooter, subFooter } from "./Styled";
import { config as appConfig } from "@webiny/app/config";

interface FooterElementConfig extends UIElementConfig {
    closeMenu: () => void;
}

export class FooterElement extends UIElement<FooterElementConfig> {
    private _footerPlaceholder: PlaceholderElement;

    constructor(id: string, config: FooterElementConfig) {
        super(id, config);

        this.useGrid(false);

        this._footerPlaceholder = this.addElement(
            new PlaceholderElement("navigation.footer.placeholder")
        );

        const wbyVersion = appConfig.getKey("WEBINY_VERSION", process.env.REACT_APP_WEBINY_VERSION);

        new GenericElement("webiny.version", () => {
            return (
                <ListItem ripple={false} className={subFooter}>
                    Webiny v{wbyVersion}
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
