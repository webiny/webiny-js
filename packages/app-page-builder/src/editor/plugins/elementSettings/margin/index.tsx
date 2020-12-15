import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
// Components
import MarginSettings from "../components/MarginPaddingSettings";

export default {
    name: "pb-editor-page-element-style-settings-margin",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <MarginSettings styleAttribute={"margin"} />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
