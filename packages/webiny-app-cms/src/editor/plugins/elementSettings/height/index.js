//@flow
import React from "react";
import { ReactComponent as HeightIcon } from "./arrows-alt-v-solid.svg";
import Settings from "./Settings";
import Action from "../components/Action";

export default {
    name: "pb-page-element-settings-height",
    type: "pb-page-element-settings",
    renderAction() {
        return <Action tooltip={"height"} plugin={this.name} icon={<HeightIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
};
