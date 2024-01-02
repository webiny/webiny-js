import React from "react";
/**
 *
 * Package react-sortable-tree does not have types
 */
// @ts-expect-error
import SortableTree from "react-sortable-tree";
import { plugins } from "@webiny/plugins";
import MenuItemRenderer from "./MenuItemRenderer";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { PbMenuItemPlugin } from "~/types";
import { MenuTreeItem } from "~/admin/views/Menus/types";

const TreeWrapper = styled("div")({
    width: "100%",
    height: 400,
    ".rst__lineHalfHorizontalRight::before, .rst__lineFullVertical::after, .rst__lineHalfVerticalTop::after, .rst__lineHalfVerticalBottom::after, .rst__lineChildren::after":
        {
            backgroundColor: "var(--mdc-theme-on-surface)"
        }
});

const EmptyTree = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--mdc-theme-on-surface)"
});

export interface MenuItemsListProps {
    items: MenuTreeItem[];
    onChange: (items: MenuTreeItem[]) => void;
    editItem: (item: MenuTreeItem) => void;
    deleteItem: (item: MenuTreeItem) => void;
    canSave: boolean;
}
class MenuItemsList extends React.Component<MenuItemsListProps> {
    static canHaveChildren(node: MenuTreeItem): boolean {
        const pbMenuItemPlugins = plugins.byType<PbMenuItemPlugin>("pb-menu-item");
        const plugin = pbMenuItemPlugins.find(pl => pl.menuItem.type === node.type);
        return plugin ? plugin.menuItem.canHaveChildren : false;
    }

    public override render() {
        const { items, onChange, editItem, deleteItem, canSave } = this.props;
        const data = Array.isArray(items) ? [...items] : [];

        let dom = (
            <EmptyTree>
                <Typography use={"overline"}>There are no menu items to display</Typography>
            </EmptyTree>
        );
        if (data.length > 0) {
            dom = (
                <SortableTree
                    treeData={data}
                    onChange={onChange}
                    canNodeHaveChildren={MenuItemsList.canHaveChildren}
                    nodeContentRenderer={MenuItemRenderer}
                    rowHeight={80}
                    getNodeKey={({ node }: { node: MenuTreeItem }) => node.id}
                    generateNodeProps={() => ({
                        editItem,
                        deleteItem,
                        canSave
                    })}
                />
            );
        }

        return <TreeWrapper>{dom}</TreeWrapper>;
    }
}

export default MenuItemsList;
