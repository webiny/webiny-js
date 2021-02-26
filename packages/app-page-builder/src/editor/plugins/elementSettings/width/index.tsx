import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import WidthSettings from "./WidthSettings";

export default {
    name: "pb-editor-page-element-style-settings-width",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <WidthSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
