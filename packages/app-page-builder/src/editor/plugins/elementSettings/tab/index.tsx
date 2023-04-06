import React from "react";
import TabSettings from "./TabSettings";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";

export default [
    {
        name: "pb-editor-page-element-style-settings-tab",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <TabSettings />;
        }
    } as PbEditorPageElementStyleSettingsPlugin
];
