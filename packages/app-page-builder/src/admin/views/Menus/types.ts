export interface MenuTreeItem {
    id: string;
    type: string;
    title?: string;
    subtitle?: string;
    expanded?: boolean;
    __new?: boolean;
    children?: MenuTreeItem[];
}
