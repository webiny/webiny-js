//@flow
import React from "react";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/delete.svg";
import DeleteAction from "./DeleteAction";
import Action from "../components/Action";

export default {
    name: "cms-element-settings-delete",
    type: "cms-element-settings",
    renderAction() {
        return (
            <DeleteAction>
                <Action tooltip={"Delete element"} shortcut="Backspace" icon={<DeleteIcon />} />
            </DeleteAction>
        );
    }
};
