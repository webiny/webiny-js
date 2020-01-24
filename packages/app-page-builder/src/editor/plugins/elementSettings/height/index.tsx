import React from "react";
import { ReactComponent as HeightIcon } from "./arrows-alt-v-solid.svg";
import Settings from "./Settings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-page-element-settings-height",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"height"} plugin={this.name} icon={<HeightIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
} as PbEditorPageElementSettingsPlugin;
