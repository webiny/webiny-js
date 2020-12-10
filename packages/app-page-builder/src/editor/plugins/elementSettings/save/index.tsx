import React from "react";
import SaveElementSetting from "./SaveElementSetting";
import { PbEditorPageElementAdvancedSettingsPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-page-element-advanced-settings-save",
    type: "pb-editor-page-element-advanced-settings",
    elementType: "all",
    render() {
        return <SaveElementSetting />;
    }
} as PbEditorPageElementAdvancedSettingsPlugin;
