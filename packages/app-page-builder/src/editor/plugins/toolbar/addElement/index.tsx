import React from "react";
import Action from "../Action";
import AddElement from "./AddElement";
import { ReactComponent as AddIcon } from "@webiny/app-page-builder/editor/assets/icons/add_circle_outline.svg";
import { PbEditorToolbarTopPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-toolbar-add-element",
    type: "pb-editor-toolbar-top",
    renderAction() {
        return <Action tooltip={"Add Element"} plugin={this.name} icon={<AddIcon />} />;
    },
    renderDrawer() {
        return <AddElement />;
    }
} as PbEditorToolbarTopPlugin;
