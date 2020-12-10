import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "@webiny/app-page-builder/types";
import WidthSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/width/WidthSettings";

export default {
    name: "pb-editor-page-element-style-settings-width",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <WidthSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
