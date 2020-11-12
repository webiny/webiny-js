import React, { useCallback } from "react";
import { css } from "emotion";
import noop from "lodash/noop";
import store from "store";
import { ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { Switch } from "@webiny/ui/Switch";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DarkModeIcon } from "@webiny/app-admin/assets/icons/round-invert_colors-24px.svg";
import { useUi } from "@webiny/app/hooks/useUi";
import { LOCAL_STORAGE_KEY } from "./DarkModeController";

const darkModeSwitch = css({
    margin: "5px 0 0 5px"
});

export const DarkModeToggle = () => {
    const { darkMode } = useUi();

    const toggleDarkMode = useCallback(() => {
        if (darkMode) {
            store.remove(LOCAL_STORAGE_KEY);
        } else {
            store.set(LOCAL_STORAGE_KEY, 1);
        }
    }, [darkMode]);

    return (
        <ListItem ripple={false} onClick={toggleDarkMode}>
            <ListItemGraphic>
                <Icon icon={<DarkModeIcon />} />
            </ListItemGraphic>
            Dark mode:
            <ListItemMeta>
                <Switch className={darkModeSwitch} value={darkMode} onChange={noop} />
            </ListItemMeta>
        </ListItem>
    );
};
