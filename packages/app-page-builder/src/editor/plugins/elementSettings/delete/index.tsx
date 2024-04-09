import React from "react";
import { ReactComponent as DeleteIcon } from "../../../assets/icons/delete.svg";
import DeleteAction from "./DeleteAction";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "~/types";

export default {
    name: "pb-editor-page-element-settings-delete",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return (
            <DeleteAction>
                <Action
                    tooltip={"Delete selected"}
                    shortcut={["Backspace", "Delete"]}
                    icon={<DeleteIcon />}
                />
            </DeleteAction>
        );
    }
} as PbEditorPageElementSettingsPlugin;
