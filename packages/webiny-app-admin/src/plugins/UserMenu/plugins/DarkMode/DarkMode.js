// @flow
import React from "react";
import { ListItem, ListItemGraphic, ListItemMeta } from "webiny-ui/List";
import { Switch } from "webiny-ui/Switch";
import { Icon } from "webiny-ui/Icon";
import { ReactComponent as DarkModeIcon } from "webiny-app-admin/assets/icons/round-invert_colors-24px.svg";
import { withTheme, type WithThemeProps } from "webiny-app-admin/components";

const DarkMode = ({ theme, toggleDarkMode }: WithThemeProps) => {
    return (
        <ListItem ripple={false} onClick={() => toggleDarkMode()}>
            <ListItemGraphic>
                <Icon icon={<DarkModeIcon />} />
            </ListItemGraphic>
            Dark mode:
            <ListItemMeta>
                <Switch value={theme.dark} onChange={() => {}} />
            </ListItemMeta>
        </ListItem>
    );
};

export default withTheme()(DarkMode);
