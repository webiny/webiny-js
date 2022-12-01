import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";
import PropertySettings from "./PropertySettings";

export default {
    name: "pb-editor-page-element-style-settings-property",
    type: "pb-editor-page-element-style-settings",
    elements: true,
    render({ options }) {
        return <PropertySettings options={options} />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
