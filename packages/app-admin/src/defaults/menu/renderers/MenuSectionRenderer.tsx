import React, { Fragment } from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { ElementRenderer, ElementRenderParams } from "@webiny/ui-composer/ElementRenderer";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";

const menuSectionTitle = css({
    marginLeft: 20,
    display: "flex",
    alignItems: "center",
    color: "var(--mdc-theme-on-surface)"
});

const iconWrapper = css({
    marginRight: 5,
    color: "var(--mdc-theme-on-surface)"
});

export class MenuSectionRenderer extends ElementRenderer<NavigationMenuElement> {
    canRender(element: NavigationMenuElement): boolean {
        return element.depth === 2;
    }

    render({ element, props, next }: ElementRenderParams<NavigationMenuElement>): React.ReactNode {
        return (
            <Fragment>
                <div className={menuSectionTitle}>
                    <div className={iconWrapper}>{element.config.icon}</div>
                    <Typography use="overline">{element.config.label}</Typography>
                </div>
                {next(props)}
            </Fragment>
        );
    }
}
