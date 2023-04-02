import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import VerticalAlignSettings from "./VerticalAlignSettings";

export default {
    name: "pb-editor-page-element-style-settings-cell-vertical-align",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <VerticalAlignSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
