import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import BorderSettings from "./BorderSettings";

export default {
    name: "pb-editor-page-element-style-settings-border",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <BorderSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
