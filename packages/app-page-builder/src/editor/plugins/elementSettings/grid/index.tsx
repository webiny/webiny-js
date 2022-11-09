import React from "react";
import { GridSettings } from "./GridSettings";
import { GridOptions } from "./GridOptions";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";

export default [
    {
        name: "pb-editor-page-element-style-settings-grid",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <GridSettings />;
        }
    } as PbEditorPageElementStyleSettingsPlugin,
    {
        name: "pb-editor-page-element-style-settings-grid-options",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <GridOptions />;
        }
    } as PbEditorPageElementStyleSettingsPlugin
];
