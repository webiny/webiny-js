//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { deleteElement } from "webiny-app-cms/editor/actions";
import { getPlugin } from "webiny-app/plugins";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/delete.svg";
import Action from "../Action";

export default {
    name: "element-settings-delete",
    type: "cms-element-settings",
    renderAction({ parent, element }) {
        const plugin = getPlugin(element.type);
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
