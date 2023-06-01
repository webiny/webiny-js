import React from "react";
import AccordionItemSettings from "./AccordionItemSettings";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";

export default {
    name: "pb-editor-page-element-style-settings-accordion-item",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <AccordionItemSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
