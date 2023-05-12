import React from "react";
import { GridSize } from "./GridSize";
import { GridSettings } from "./GridSettings";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";

export default [
    {
        name: "pb-editor-page-element-style-settings-grid",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <GridSize />;
        }
    } as PbEditorPageElementStyleSettingsPlugin,
    {
        name: "pb-editor-page-element-style-settings-grid-settings",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <GridSettings />;
        }
    } as PbEditorPageElementStyleSettingsPlugin
];
