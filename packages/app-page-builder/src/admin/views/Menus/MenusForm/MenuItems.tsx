import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import uniqid from "uniqid";
import { plugins } from "@webiny/plugins";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Icon } from "@webiny/ui/Icon";
import { Menu } from "@webiny/ui/Menu";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { ButtonPrimary } from "@webiny/ui/Button";
import MenuItemsList from "./MenuItems/MenuItemsList";
import MenuItemForm from "./MenuItems/MenuItemForm";
import findObject from "./MenuItems/findObject";
import { PbMenuItemPlugin } from "~/types";
import { Typography } from "@webiny/ui/Typography";

const leftPanel = css({
    padding: 25,
    backgroundColor: "var(--mdc-theme-background)",
    overflow: "auto"
});

const menuItems = css({
    width: 170
});

const MenuHolder = styled("div")({
    textAlign: "center",
    color: "var(--mdc-theme-text-primary-on-background)"
});

const AddMenu = styled("div")({
    width: 180,
    margin: "25px auto 0 auto"
});

type Props = {
    canSave: boolean;
    onChange: Function;
    value: any;
};

type State = {
    currentMenuItem?: Object;
};

class MenuItems extends React.Component<Props, State> {
    form = React.createRef();
    state = {
        currentMenuItem: null
    };

    addItem = (plugin: PbMenuItemPlugin) => {
        const { onChange, value } = this.props;
        const newItem = { type: plugin.menuItem.type, id: uniqid(), __new: true };
        onChange([...value, newItem]);
        this.editItem(newItem);
    };

    editItem = data => {
        this.setState({ currentMenuItem: data });
    };

    deleteItem = item => {
        const { value, onChange } = this.props;
        const target = findObject(value, item.id);
        target && target.source.splice(target.index, 1);
        onChange(value);
        this.editItem(null);
    };

    render() {
        const { value: items, onChange, canSave } = this.props;
        const { currentMenuItem } = this.state;
        const pbMenuItemPlugins = plugins.byType<PbMenuItemPlugin>("pb-menu-item");

        return (
            <>
                <Grid>
                    <Cell span={7} className={leftPanel}>
                        <MenuItemsList
                            canSave={canSave}
                            items={items}
                            onChange={onChange}
                            editItem={this.editItem}
                            deleteItem={this.deleteItem}
                        />
                    </Cell>

                    <Cell span={5}>
                        {!currentMenuItem && canSave && (
                            <>
                                <MenuHolder>
                                    <Typography use={"body2"}>
                                        To build your menu you need to create menu items! Begin by
                                        clicking the &quot;Add menu item&quot; button
                                    </Typography>

                                    <AddMenu>
                                        <Menu
                                            handle={<ButtonPrimary>+ Add menu item</ButtonPrimary>}
                                            anchor={"topEnd"}
                                        >
                                            <List className={menuItems}>
                                                {pbMenuItemPlugins.map(pl => (
                                                    <ListItem
                                                        key={pl.name}
                                                        onClick={() => this.addItem(pl)}
                                                        style={{ whiteSpace: "nowrap" }}
                                                    >
                                                        <ListItemGraphic>
                                                            <Icon icon={pl.menuItem.icon} />
                                                        </ListItemGraphic>
                                                        {pl.menuItem.title}
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Menu>
                                    </AddMenu>
                                </MenuHolder>
                            </>
                        )}
                        {currentMenuItem && (
                            <MenuItemForm
                                currentMenuItem={currentMenuItem}
                                editItem={this.editItem}
                                deleteItem={this.deleteItem}
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
