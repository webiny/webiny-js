//@flow
import React from "react";
import { addReducer } from "webiny-app-cms/editor/redux";
import { ELEMENT_DROPPED } from "webiny-app-cms/editor/actions";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add_circle_outline.svg";
import AddElement from "./AddElement";
import Action from "../Action";

addReducer([ELEMENT_DROPPED], "ui.activeElement", () => null);

export default {
    name: "cms-toolbar-add-element",
    type: "cms-toolbar-top",
    renderAction({ active }: { active: Boolean }) {
        return (
            <Action tooltip={"Add Element"} active={active} plugin={this.name} icon={<AddIcon />} />
        );
    },
    renderDrawer({ withDrawer }: { withDrawer: Function }) {
        return withDrawer(<AddElement />);
    }
};
