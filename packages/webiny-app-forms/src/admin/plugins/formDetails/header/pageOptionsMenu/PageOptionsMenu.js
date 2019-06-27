// @flow
import React from "react";
import { IconButton } from "webiny-ui/Button";
import { Icon } from "webiny-ui/Icon";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/admin/assets/more_vert.svg";
import { ReactComponent as PreviewIcon } from "webiny-app-cms/admin/assets/visibility.svg";
import { ListItemGraphic } from "webiny-ui/List";
import { MenuItem, Menu } from "webiny-ui/Menu";
import { css } from "emotion";

const menuStyles = css({
    width: 250,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const PageOptionsMenu = () => {
    return (
        <Menu
            className={menuStyles}
            handle={<IconButton icon={<MoreVerticalIcon />} />}
            openSide={"left"}
        >
            <MenuItem onClick={() => {}}>
                <ListItemGraphic>
                    <Icon icon={<PreviewIcon />} />
                </ListItemGraphic>
                TODO?
            </MenuItem>
        </Menu>
    );
};

export default PageOptionsMenu;
