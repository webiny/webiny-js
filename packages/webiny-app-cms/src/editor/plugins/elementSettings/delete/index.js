//@flow
import React from "react";
import { dispatch } from "webiny-app-cms/editor/redux";
import { deleteElement } from "webiny-app-cms/editor/actions";
import { getPlugin } from "webiny-app/plugins";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/delete.svg";
import Action from "../Action";

export default {
    name: "cms-element-settings-delete",
    type: "cms-element-settings",
    renderAction({ parent, element }: Object) {
        const plugin = getPlugin(element.type);
        if (!plugin) {
            return null;
        }

        if (typeof plugin.canDelete === "function") {
            if (!plugin.canDelete({ parent, element })) {
                return null;
            }
        }

        return (
            <Action
                tooltip={"Delete element"}
                shortcut="Backspace"
                onClick={() => dispatch(deleteElement({ element }))}
                icon={<DeleteIcon />}
            />
        );
    }
};
