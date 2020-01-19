import React from "react";
import { ReactComponent as BorderIcon } from "@webiny/app-page-builder/editor/assets/icons/border_outer.svg";
import Settings from "./Settings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-page-element-settings-border",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Border"} plugin={this.name} icon={<BorderIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
} as PbEditorPageElementSettingsPlugin;
