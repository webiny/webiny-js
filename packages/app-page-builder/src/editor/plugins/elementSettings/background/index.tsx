import React from "react";
import { ReactComponent as InvertColorsIcon } from "@webiny/app-page-builder/editor/assets/icons/invert_colors.svg";
import Settings from "./Settings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-page-element-settings-background",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action plugin={this.name} tooltip={"Background"} icon={<InvertColorsIcon />} />;
    },
    renderMenu({ options }) {
        return <Settings options={options} />;
    }
} as PbEditorPageElementSettingsPlugin;
