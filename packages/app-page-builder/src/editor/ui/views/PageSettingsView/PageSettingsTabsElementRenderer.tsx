import React from "react";
import { css } from "emotion";
import { UIRenderer, UIRenderParams } from "@webiny/app-admin/ui/UIRenderer";
import { PageSettingsTabsElement } from "~/editor/ui/views/PageSettingsView/PageSettingsTabsElement";
import { List } from "@webiny/ui/List";

export const listStyle = css({
    "&.mdc-deprecated-list": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

export class PageSettingsTabsElementRenderer extends UIRenderer<PageSettingsTabsElement> {
    public render({ next }: UIRenderParams<PageSettingsTabsElement>): React.ReactNode {
        return (
            <List twoLine className={listStyle}>
                {next()}
            </List>
        );
    }
}
