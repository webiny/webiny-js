import React, { useState } from "react";
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
import { MenuTreeItem } from "~/admin/views/Menus/types";
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
interface MenuItemsProps {
    canSave: boolean;
    onChange: (items: MenuTreeItem[]) => void;
    value: MenuTreeItem[];
}
type MenuItemsState = MenuTreeItem | null;
const MenuItems = (props: MenuItemsProps) => {
    const [currentMenuItem, setCurrentMenuItem] = useState<MenuItemsState>(null);
    const editItem = (data: MenuTreeItem | null): void => {
        setCurrentMenuItem(data);
    };
    const addItem = (plugin: PbMenuItemPlugin): void => {
        const { onChange, value } = props;
        const newItem: MenuTreeItem = { type: plugin.menuItem.type, id: uniqid(), __new: true };
        onChange([...value, newItem]);
        editItem(newItem);
    };
    const deleteItem = (item: MenuTreeItem): void => {
        const { value, onChange } = props;
        const target = findObject(value, item.id);
        target && target.source.splice(target.index, 1);
        onChange(value);
        editItem(null);
    };
    const { value: items, onChange, canSave } = props;
    const pbMenuItemPlugins = plugins.byType<PbMenuItemPlugin>("pb-menu-item");
    return (
        <>
            <Grid>
                <Cell span={7} className={leftPanel}>
                    <MenuItemsList
                        canSave={canSave}
                        items={items}
                        onChange={onChange}
                        editItem={editItem}
                        deleteItem={deleteItem}
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
                                        handle={
                                            <ButtonPrimary data-testid="pb.menu.add.addmenuitem">
                                                + Add menu item
                                            </ButtonPrimary>
                                        }
                                        anchor={"topEnd"}
                                        data-testid="pb.menu.create.items.button"
                                    >
                                        <List className={menuItems}>
                                            {pbMenuItemPlugins.map(pl => (
                                                <ListItem
                                                    key={pl.name}
                                                    onClick={() => addItem(pl)}
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
                            editItem={editItem}
                            deleteItem={deleteItem}
                            items={items}
                            onChange={onChange}
                        />
                    )}
                </Cell>
            </Grid>
        </>
    );
};
export default MenuItems;
