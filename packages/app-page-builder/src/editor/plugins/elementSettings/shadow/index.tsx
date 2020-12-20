import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import ShadowSettings from "./ShadowSettings";

export default {
    name: "pb-editor-page-element-style-settings-shadow",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <ShadowSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
