//@flow
import React from "react";
import { ReactComponent as PaddingIcon } from "@webiny/app-page-builder/editor/assets/icons/fullscreen_exit.svg";
import Settings from "../components/PMSettings";
import Action from "../components/Action";

export default {
    name: "pb-page-element-settings-padding",
    type: "pb-page-element-settings",
    renderAction() {
        return <Action tooltip={"Padding"} plugin={this.name} icon={<PaddingIcon />} />;
    },
    renderMenu() {
        return <Settings title="Padding" styleAttribute="padding" />;
    }
};
