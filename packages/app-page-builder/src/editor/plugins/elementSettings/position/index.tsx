import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";
import PositionSettings from "./PositionSettings";

export default {
    name: "pb-editor-page-element-style-settings-position",
    type: "pb-editor-page-element-style-settings",

    render() {
        return <PositionSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
