import React from "react";
import Action from "../components/Action";
import { Settings } from "./Settings";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";
import { ReactComponent as CellIcon } from "@webiny/app-page-builder/editor/assets/icons/column-icon.svg";

export default {
    name: "pb-editor-page-element-settings-grid",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Grid"} plugin={this.name} icon={<CellIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
} as PbEditorPageElementSettingsPlugin;
