import React from "react";
import { UIRenderer, UIRenderParams } from "~/ui/UIRenderer";
import { css } from "emotion";
import { Menu } from "@webiny/ui/Menu";
import { TopAppBarActionItem } from "@webiny/ui/TopAppBar";
import { List } from "@webiny/ui/List";
import { UserMenuElement } from "./UserMenuElement";

const menuDialog = css({
    "&.mdc-menu": {
        minWidth: 300
    }
});

export class UserMenuRenderer extends UIRenderer<UserMenuElement> {
    render({ element, props, next }: UIRenderParams<UserMenuElement>): React.ReactNode {
        const handle = element.getMenuHandleElement();
        return (
            <Menu
                className={menuDialog}
                anchor={"topEnd"}
                handle={
                    <TopAppBarActionItem icon={<div>{handle ? handle.render(props) : null}</div>} />
                }
            >
                <List data-testid="logged-in-user-menu-list">{next()}</List>
            </Menu>
        );
    }
}
