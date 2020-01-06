//@flow
import React from "react";
import { ReactComponent as WidthIcon } from "./arrows-alt-h-solid.svg";

import Settings from "./Settings";
import Action from "../components/Action";

export default {
    name: "pb-page-element-settings-width",
    type: "pb-page-element-settings",
    renderAction() {
        return <Action tooltip={"Width"} plugin={this.name} icon={<WidthIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
};
