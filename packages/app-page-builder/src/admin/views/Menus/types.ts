import { TreeItemComponentProps as DefaultTreeItemComponentProps } from "dnd-kit-sortable-tree";
export interface MenuTreeItem {
    id: string;
    type: string;
    title?: string;
    subtitle?: string;
    expanded?: boolean;
    __new?: boolean;
    children?: MenuTreeItem[];
    canHaveChildren?: boolean;
}
export interface TreeItemComponentProps extends DefaultTreeItemComponentProps<MenuTreeItem> {
    editItem: (item: MenuTreeItem) => void;
    deleteItem: (item: MenuTreeItem) => void;
}
