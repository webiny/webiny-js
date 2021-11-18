import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import ActionSettings from "./ActionSettings";

export default {
    name: "pb-editor-page-element-style-settings-action",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <ActionSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
