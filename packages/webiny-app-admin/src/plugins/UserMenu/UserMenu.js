import React from "react";
import { css } from "emotion";
import { Plugins, Plugin } from "webiny-app/components";
import { Menu } from "webiny-ui/Menu";
import { List } from "webiny-ui/List";
import { TopAppBarActionItem } from "webiny-ui/TopAppBar";

const menuDialog = css({
    "&.mdc-menu": {
        minWidth: 300
    }
});

const UserMenu = () => {
    return (
        <TopAppBarActionItem>
            <Menu
                className={menuDialog}
                anchor={"topEnd"}
                handle={
                    <menu-handle>
                        <Plugin name={"user-menu-handle"} />
                    </menu-handle>
                }
            >
                <List>
                    <Plugins type={"header-user-menu"} />
                </List>
            </Menu>
        </TopAppBarActionItem>
    );
};

export default UserMenu;
