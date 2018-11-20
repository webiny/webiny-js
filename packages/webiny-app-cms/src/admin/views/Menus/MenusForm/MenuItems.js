// @flow
import React from "react";
import { css } from "emotion";
import uniqid from "uniqid";
import { getPlugins } from "webiny-app/plugins";
import { Grid, Cell } from "webiny-ui/Grid";
import { Icon } from "webiny-ui/Icon";
import { Menu, MenuItem } from "webiny-ui/Menu";
import { ButtonPrimary } from "webiny-ui/Button";
import MenuItemsList from "./MenuItems/MenuItemsList";
import MenuItemForm from "./MenuItems/MenuItemForm";
import findObject from "./MenuItems/findObject";
import type { CmsMenuItemPluginType } from "webiny-app-cms/types";

const leftPanel = css({
    padding: 25,
    backgroundColor: "var(--mdc-theme-background)",
    overflow: "scroll"
});

type Props = {
    onChange: Function,
    value: any,
    menuForm: *
};

type State = {
    currentMenuItem: ?Object
};

class MenuItems extends React.Component<Props, State> {
    form = React.createRef();

    state = {
        currentMenuItem: null
    };

    addItem = (plugin: CmsMenuItemPluginType) => {
        const { onChange, value } = this.props;
        const newItem = { type: plugin.name, id: uniqid() };
        onChange([...value, newItem]);
        this.editItem(newItem);
    };

    editItem = (data: ?Object) => {
        this.setState({ currentMenuItem: data });
    };

    deleteItem = (item: Object) => {
        const { value, onChange } = this.props;
        const target = findObject(value, item.id);
        target && target.source.splice(target.index, 1);
        onChange(value);
        this.editItem(null);
    };

    render() {
        const { value: items, onChange } = this.props;
        const { currentMenuItem } = this.state;
        const plugins = getPlugins("cms-menu-item");

        return (
            <>
                <Grid>
                    <Cell span={6} className={leftPanel}>
                        <MenuItemsList
                            menuForm={this.props.menuForm}
                            items={items}
                            onChange={onChange}
                            editItem={this.editItem}
                            deleteItem={this.deleteItem}
                        />
                    </Cell>
                    <Cell span={6}>
                        {!currentMenuItem && (
                            <>
                                <div style={{ textAlign: "center" }}>
                                    <p>
                                        To build your menu you need to create menu items!
                                        <br />
                                        Begin by clicking the "Add menu item" button
                                    </p>
                                    <br />
                                    <div style={{ width: 156, margin: "0 auto" }}>
                                        <Menu
                                            handle={<ButtonPrimary>+ Add menu item</ButtonPrimary>}
                                        >
                                            {plugins.map(pl => (
                                                <MenuItem
                                                    key={pl.name}
                                                    onClick={() => this.addItem(pl)}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    <Icon icon={pl.icon} />
                                                    &nbsp;&nbsp;
                                                    {pl.title}
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </div>
                                </div>
                            </>
                        )}
                        {currentMenuItem && (
                            <MenuItemForm
                                currentMenuItem={currentMenuItem}
                                editItem={this.editItem}
                                items={items}
                                onChange={onChange}
                            />
                        )}
                    </Cell>
                </Grid>
            </>
        );
    }
}

export default MenuItems;
