//@flow
import React from "react";
import { ReactComponent as WidthIcon } from "webiny-app-cms/editor/assets/icons/width-icon.svg";
import Settings from "./Settings";
import Action from "../components/Action";

export default {
    name: "cms-element-settings-width",
    type: "cms-element-settings",
    renderAction() {
        return <Action tooltip={"Width"} plugin={this.name} icon={<WidthIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
};
