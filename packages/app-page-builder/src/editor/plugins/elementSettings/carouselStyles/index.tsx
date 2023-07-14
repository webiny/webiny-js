import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "../../../../types";
import CarouselStylesSettings from "./CarouselStyles";

export default {
    name: "pb-editor-page-element-style-settings-carousel-styles",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <CarouselStylesSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
