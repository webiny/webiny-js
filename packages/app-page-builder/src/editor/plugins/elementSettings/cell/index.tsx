import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import CellSettings from "./CellSettings";
import VerticalAlignSettings from "./VerticalAlignSettings";

export default [
    {
        name: "pb-editor-page-element-style-settings-cell-settings",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <CellSettings />;
        }
    } as PbEditorPageElementStyleSettingsPlugin,
    {
        name: "pb-editor-page-element-style-settings-cell-vertical-align",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <VerticalAlignSettings />;
        }
    } as PbEditorPageElementStyleSettingsPlugin
];
