import React from "react";
import { PbEditorToolbarTopPlugin } from "~/types";
import Action from "../Action";
import AddElement from "./AddElement";
import { ReactComponent as AddIcon } from "~/editor/assets/icons/add_circle_outline.svg";

export default {
    name: "pb-editor-toolbar-add-element",
    type: "pb-editor-toolbar-top",
    renderAction() {
        return (
            <Action
                tooltip={"Add Element"}
                plugin={this.name}
                icon={<AddIcon />}
                closeOtherInGroup={true}
            />
        );
    },
    renderDrawer() {
        return <AddElement />;
    }
} as PbEditorToolbarTopPlugin;
