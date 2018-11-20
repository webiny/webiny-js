// @flow
import { compose, withHandlers } from "recompose";
import { omitBy, isNull } from "lodash";
import { getPlugin } from "webiny-app/plugins";
import findObject from "./findObject";
import uniqid from "uniqid";

const MenuItemForm = ({ onSubmit, onCancel, currentMenuItem }: Object) => {
    const plugin = getPlugin(currentMenuItem.type);
    if (!plugin) {
        return null;
    }
    return plugin.renderForm({ onSubmit, onCancel, data: currentMenuItem });
};

export default compose(
    withHandlers({
        onCancel: ({ editItem }) => () => {
            editItem(null);
        },
        onSubmit: ({ items, onChange, editItem }) => data => {
            const item = omitBy(data, isNull);
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
    })
)(MenuItemForm);
