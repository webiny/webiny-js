//@flow
import React from "react";
import { ReactComponent as BorderIcon } from "webiny-app-cms/editor/assets/icons/border_outer.svg";
import Settings from "./Settings";
import Action from "../components/Action";

export default {
    name: "cms-element-settings-border",
    type: "cms-element-settings",
    renderAction() {
        return <Action tooltip={"Border"} plugin={this.name} icon={<BorderIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
};
