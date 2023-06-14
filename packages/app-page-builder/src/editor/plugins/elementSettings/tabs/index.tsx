import React from "react";
import TabsList from "./TabsList";
import { PbEditorPageElementAdvancedSettingsPlugin } from "~/types";

export default {
    name: "pb-editor-page-element-advanced-settings-tabs",
    type: "pb-editor-page-element-advanced-settings",
    elementType: "tabs",
    render() {
        return <TabsList />;
    }
} as PbEditorPageElementAdvancedSettingsPlugin;
