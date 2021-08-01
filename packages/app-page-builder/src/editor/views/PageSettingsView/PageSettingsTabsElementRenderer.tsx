import React from "react";
import { css } from "emotion";
import { UIRenderer, UIRenderParams } from "@webiny/ui-composer/UIRenderer";
import { PageSettingsTabsElement } from "~/editor/views/PageSettingsView/PageSettingsTabsElement";
import { List } from "@webiny/ui/List";

export const listStyle = css({
    "&.mdc-list": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

export class PageSettingsTabsElementRenderer extends UIRenderer<PageSettingsTabsElement> {
    render({ next }: UIRenderParams<PageSettingsTabsElement>): React.ReactNode {
        return (
            <List twoLine className={listStyle}>
                {next()}
            </List>
        );
    }
}
