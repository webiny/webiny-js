import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
// Components
import MarginPaddingSettings from "../components/MarginPaddingSettings";

export default {
    name: "pb-editor-page-element-style-settings-padding",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <MarginPaddingSettings styleAttribute={"padding"} />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
