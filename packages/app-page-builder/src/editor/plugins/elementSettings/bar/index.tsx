import React from "react";
import Bar from "./ElementSettingsBar";
import { PbEditorBarPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-element-settings-bar",
    type: "pb-editor-bar",
    shouldRender({ activeElement }) {
        return activeElement;
    },

    render() {
        return <Bar />;
    }
} as PbEditorBarPlugin;
