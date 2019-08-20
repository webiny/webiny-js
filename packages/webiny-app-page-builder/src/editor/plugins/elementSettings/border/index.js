//@flow
import React from "react";
import { ReactComponent as BorderIcon } from "webiny-app-page-builder/editor/assets/icons/border_outer.svg";
import Settings from "./Settings";
import Action from "../components/Action";

export default {
    name: "pb-page-element-settings-border",
    type: "pb-page-element-settings",
    renderAction() {
        return <Action tooltip={"Border"} plugin={this.name} icon={<BorderIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
};
