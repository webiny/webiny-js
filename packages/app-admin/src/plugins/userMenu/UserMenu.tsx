import React from "react";
import { css } from "emotion";
import { renderPlugins, renderPlugin } from "@webiny/app/plugins";
import { Menu } from "@webiny/ui/Menu";
import { List } from "@webiny/ui/List";
import { TopAppBarActionItem } from "@webiny/ui/TopAppBar";
import {
    AdminHeaderUserMenuHandlePlugin,
    AdminHeaderUserMenuPlugin,
    AdminHeaderUserMenuUserInfoPlugin
} from "@webiny/app-admin/types";

const menuDialog = css({
    "&.mdc-menu": {
        minWidth: 300
    }
});

const UserMenu = () => {
    return (
        <Menu
            className={menuDialog}
            anchor={"topEnd"}
            handle={
                <TopAppBarActionItem
                    icon={
                        <div>
                            {renderPlugin<AdminHeaderUserMenuHandlePlugin>(
                                "admin-header-user-menu-handle"
                            )}
                        </div>
                    }
                />
            }
        >
            <List data-testid="logged-in-user-menu-list">
                {renderPlugin<AdminHeaderUserMenuUserInfoPlugin>(
                    "admin-header-user-menu-user-info"
                )}
                {renderPlugins<AdminHeaderUserMenuPlugin>("admin-header-user-menu")}
            </List>
        </Menu>
    );
};

export default UserMenu;
