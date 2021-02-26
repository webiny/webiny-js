import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import VisibilitySettings from "./VisibilitySettings";

export default {
    name: "pb-editor-page-element-style-settings-visibility",
    type: "pb-editor-page-element-style-settings",
    render({ options }) {
        return <VisibilitySettings options={options} />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
