import React from "react";
import { css } from "emotion";
import { ElementRenderer, ElementRenderParams } from "@webiny/ui-composer/ElementRenderer";
import { PageSettingsTabsElement } from "~/editor/views/PageSettingsView/PageSettingsTabsElement";
import { List } from "@webiny/ui/List";

export const listStyle = css({
    "&.mdc-list": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

export class PageSettingsTabsElementRenderer extends ElementRenderer<PageSettingsTabsElement> {
    render({ next }: ElementRenderParams<PageSettingsTabsElement>): React.ReactNode {
        return (
            <List twoLine className={listStyle}>
                {next()}
            </List>
        );
    }
}
