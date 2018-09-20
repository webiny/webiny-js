//@flow
import React from "react";
import { connect } from "react-redux";
import { getPlugin, getPlugins } from "webiny-app/plugins";
import { getActivePlugin } from "webiny-app-cms/editor/selectors";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { Menu } from "webiny-ui/Menu";
import { css } from "emotion";
import { Icon } from "webiny-ui/Icon";
import { List, ListItem, ListItemMeta } from "webiny-ui/List";
import { ReactComponent as DownButton } from "webiny-app-cms/editor/assets/icons/round-arrow_drop_down-24px.svg";

const menuList = css({
    ".mdc-list-item": {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "baseline",
        textAlign: "left"
    }
});

const PLUGIN_TYPE = "cms-editor-content-preview";

const Preview = ({ activePlugin, togglePlugin }) => {
    const plugins = getPlugins(PLUGIN_TYPE);
    const previewPlugin = activePlugin ? getPlugin(activePlugin) : plugins[0];

    if (!previewPlugin) {
        return null;
    }

    return (
        <Menu
            className={menuList}
            handle={
                <List>
                    <ListItem>
                        {previewPlugin.renderOption()}
                        <ListItemMeta>
                            <Icon icon={<DownButton />} />
                        </ListItemMeta>
                    </ListItem>
                </List>
            }
        >
            <List>
                {plugins.map(pl => (
                    <ListItem key={pl.name} onClick={() => togglePlugin({ name: pl.name })}>
                        {pl.renderOption()}
                    </ListItem>
                ))}
            </List>
        </Menu>
    );
};

export default connect(
    state => ({ activePlugin: getActivePlugin(PLUGIN_TYPE)(state) }),
    { togglePlugin }
)(Preview);
