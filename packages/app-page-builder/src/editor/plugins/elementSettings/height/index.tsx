import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import HeightSettings from "./HeightSettings";

export default {
    name: "pb-editor-page-element-style-settings-height",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <HeightSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
