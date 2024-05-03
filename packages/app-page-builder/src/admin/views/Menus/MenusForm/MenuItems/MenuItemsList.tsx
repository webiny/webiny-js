import React, { useCallback } from "react";
import NodeRendererDefault, { NodeRendererDefaultProps } from "./MenuItemRenderer";
import { SortableTree, TreeItems, TreeItemComponentProps } from "dnd-kit-sortable-tree";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
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

const canHaveChildren = (node: MenuTreeItem) => {
    node.canHaveChildren = node.type === "folder";
    if (node.children) {
        node.children.forEach(child => {
            canHaveChildren(child);
        });
    }
};

const traverseItems = (tree: MenuTreeItem[]) => {
    tree.forEach(node => canHaveChildren(node));
    return tree;
};

const MenuItemsList = (props: MenuItemsListProps) => {
    const { items, onChange, editItem, deleteItem } = props;
    const data = Array.isArray(items) ? [...items] : [];
    const modifiedData = traverseItems(data) as unknown as TreeItems<NodeRendererDefaultProps>;
    const onChangeTree = useCallback(
        (items: TreeItems<NodeRendererDefaultProps>) => {
            const menuItems = items as unknown as MenuTreeItem[];
            onChange(menuItems);
        },
        [onChange]
    );
    let dom = (
        <EmptyTree>
            <Typography use={"overline"}>There are no menu items to display</Typography>
        </EmptyTree>
    );
    const TreeNode = React.forwardRef<HTMLDivElement, TreeItemComponentProps<MenuTreeItem>>(
        (props, ref) => (
            <NodeRendererDefault {...props} ref={ref} editItem={editItem} deleteItem={deleteItem} />
        )
    );
    TreeNode.displayName = "TreeNode";
    if (data.length > 0) {
        dom = (
            <SortableTree
                items={modifiedData}
                onItemsChanged={items => onChangeTree(items)}
                // @ts-expect-error
                TreeItemComponent={TreeNode}
                indentationWidth={30}
            />
        );
    }
    return <TreeWrapper>{dom}</TreeWrapper>;
};
export default MenuItemsList;
