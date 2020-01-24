import React from "react";
import { ReactComponent as ShadowIcon } from "@webiny/app-page-builder/editor/assets/icons/layers.svg";
import Settings from "./Settings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-page-element-settings-shadow",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Shadow"} plugin={this.name} icon={<ShadowIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
} as PbEditorPageElementSettingsPlugin;
