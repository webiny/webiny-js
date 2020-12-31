import React from "react";
import { GridSettings } from "./GridSettings";
import { PbEditorPageElementStyleSettingsPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-page-element-style-settings-grid",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <GridSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
