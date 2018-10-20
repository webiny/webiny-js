import React from "react";
import { css } from "emotion";
import { getPlugin, renderPlugins } from "webiny-app/plugins";
import { Menu } from "webiny-ui/Menu";
import { List } from "webiny-ui/List";
import { TopAppBarActionItem } from "webiny-ui/TopAppBar";

const menuDialog = css({
    "&.mdc-menu": {
        minWidth: 300
    }
});

const renderHandle = () => {
    const plugin = getPlugin("user-menu-handle");
    if (plugin) {
        return <menu-handle>{plugin.render()}</menu-handle>;
    }
    return null;
};

const UserMenu = () => {
    return (
        <TopAppBarActionItem>
            <Menu className={menuDialog} anchor={"topEnd"} handle={renderHandle()}>
                <List>
                    {renderPlugins("header-user-menu")}
                </List>
            </Menu>
        </TopAppBarActionItem>
    );
};

export default UserMenu;
