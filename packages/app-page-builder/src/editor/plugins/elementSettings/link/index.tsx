import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import HrefSettings from "./HrefSettings";

export default {
    name: "pb-editor-page-element-style-settings-link",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <HrefSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
