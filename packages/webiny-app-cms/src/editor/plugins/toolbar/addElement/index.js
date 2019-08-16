//@flow
import * as React from "react";
import { addReducer } from "webiny-app-cms/editor/redux";
import { ELEMENT_DROPPED } from "webiny-app-cms/editor/actions";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add_circle_outline.svg";
import AddElement from "./AddElement";
import Action from "../Action";

addReducer([ELEMENT_DROPPED], "ui.activeElement", () => null);

export default {
    name: "pb-editor-toolbar-add-element",
    type: "pb-editor-toolbar-top",
    renderAction() {
        return <Action tooltip={"Add Element"} plugin={this.name} icon={<AddIcon />} />;
    },
    renderDrawer() {
        return <AddElement />;
    }
};
