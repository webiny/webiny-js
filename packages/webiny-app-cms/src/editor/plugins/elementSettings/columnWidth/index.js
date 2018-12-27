//@flow
import React from "react";
import { ReactComponent as WidthIcon } from "./arrows-alt-h-solid.svg";

import Settings from "./Settings";
import Action from "../components/Action";

export default {
    name: "cms-element-settings-column-width",
    type: "cms-element-settings",
    renderAction() {
        return <Action tooltip={"Width"} plugin={this.name} icon={<WidthIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
};
