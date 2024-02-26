import omit from "lodash/omit";
import omitBy from "lodash/omitBy";
import isNull from "lodash/isNull";
import uniqid from "uniqid";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { plugins } from "@webiny/plugins";
import findObject from "./findObject";
import { PbMenuItemPlugin } from "~/types";
import { MenuTreeItem } from "~/admin/views/Menus/types";

interface MenuItemFormProps {
    currentMenuItem: MenuTreeItem;
    onChange: (items: MenuTreeItem[]) => void;
    editItem: (item: MenuTreeItem) => void;
    deleteItem: (item: MenuTreeItem) => void;
    items: MenuTreeItem[];
}

type MenuItemFormData = Partial<MenuTreeItem>;
const MenuItemForm = (props: MenuItemFormProps) => {
    const { onCancel, onSubmit } = useHandlers(props, {
        onCancel:
            ({ editItem, currentMenuItem, deleteItem }) =>
            () => {
                if (currentMenuItem.__new) {
                    deleteItem(currentMenuItem);
                } else {
                    editItem(null);
                }
            },
        onSubmit:
            ({ items, onChange, editItem }) =>
            (data: MenuItemFormData) => {
                const item = omit(omitBy(data, isNull), ["__new"]) as MenuItemFormData;
                if (item.id) {
                    const target = findObject(items, item.id);
                    if (target) {
                        target.source[target.index] = item;
                        onChange([...items]);
                    }
                } else {
                    item.id = uniqid();
                    onChange([...items, item]);
                }

                editItem(null);
            }
    });

    const { currentMenuItem } = props;
    const menuItemPlugins = plugins.byType<PbMenuItemPlugin>("pb-menu-item");
    const plugin = menuItemPlugins.find(pl => pl.menuItem.type === currentMenuItem.type);
    if (!plugin) {
        return null;
    }
    return plugin.menuItem.renderForm({
        onSubmit,
        onCancel,
        data: currentMenuItem
    });
};

export default MenuItemForm;
