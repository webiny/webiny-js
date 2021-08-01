import React from "react";
import { NavigationMenuElement } from "@webiny/app-admin/elements/NavigationMenuElement";
import { ElementRenderer, ElementRenderParams } from "@webiny/ui-composer/ElementRenderer";
import { List, ListItem } from "@webiny/ui/List";
import { css } from "emotion";
import { ElementConfig } from "@webiny/ui-composer/Element";

const linkStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "100%",
    outline: "none",
    paddingLeft: 65,
    "&:hover": {
        textDecoration: "none"
    }
});

const submenuItems = css({
    ".mdc-drawer &.mdc-list-item": {
        paddingLeft: 0
    }
});

const submenuList = css({
    "&.mdc-list": {
        padding: 0
    }
});

interface NothingToShowElementConfig extends ElementConfig {
    label: string;
}

export class NothingToShowElement extends NavigationMenuElement {
    constructor(id, config: NothingToShowElementConfig) {
        super(id, config);

        this.addRenderer(new NothingToShowRenderer());
    }
}

export class NothingToShowRenderer extends ElementRenderer<NavigationMenuElement> {
    canRender(element: NavigationMenuElement): boolean {
        return element instanceof NothingToShowElement;
    }

    render({ element }: ElementRenderParams<NavigationMenuElement>): React.ReactNode {
        return (
            <List className={submenuList} style={{ opacity: 0.4 }}>
                <ListItem className={submenuItems} ripple={false} disabled>
                    <span className={linkStyle}>{element.config.label}</span>
                </ListItem>
            </List>
        );
    }
}
