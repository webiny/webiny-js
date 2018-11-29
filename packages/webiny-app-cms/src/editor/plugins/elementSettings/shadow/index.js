//@flow
import React from "react";
import { ReactComponent as ShadowIcon } from "webiny-app-cms/editor/assets/icons/layers.svg";
import Settings from "./Settings";
import Action from "../components/Action";

export default {
    name: "cms-element-settings-shadow",
    type: "cms-element-settings",
    renderAction() {
        return <Action tooltip={"Shadow"} plugin={this.name} icon={<ShadowIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
};
