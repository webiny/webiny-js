// @flow
import { omit, omitBy, isNull } from "lodash";
import uniqid from "uniqid";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { getPlugins } from "@webiny/plugins";
import findObject from "./findObject";

const MenuItemForm = (props: Object) => {
    const { onCancel, onSubmit } = useHandlers(props, {
        onCancel: ({ editItem, currentMenuItem, deleteItem }) => () => {
            if (currentMenuItem.__new) {
                deleteItem(currentMenuItem);
            } else {
                editItem(null);
            }
        },
        onSubmit: ({ items, onChange, editItem }) => data => {
            const item = omit(omitBy(data, isNull), ["__new"]);
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
    const plugin = getPlugins("pb-menu-item").find(pl => pl.menuItem.type === currentMenuItem.type);
    if (!plugin) {
        return null;
    }
    return plugin.menuItem.renderForm({ onSubmit, onCancel, data: currentMenuItem });
};

export default MenuItemForm;
