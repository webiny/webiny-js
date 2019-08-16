//@flow
import React from "react";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/delete.svg";
import DeleteAction from "./DeleteAction";
import Action from "../components/Action";

export default {
    name: "pb-page-element-settings-delete",
    type: "pb-page-element-settings",
    renderAction() {
        return (
            <DeleteAction>
                <Action tooltip={"Delete element"} shortcut={["Backspace", "Delete"]} icon={<DeleteIcon />} />
            </DeleteAction>
        );
    }
};