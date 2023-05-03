import React from "react";
import CarouselElementSettings from "./CarouselElementSettings";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";

export default [
    {
        name: "pb-editor-page-element-style-settings-carousel-element",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <CarouselElementSettings />;
        }
    } as PbEditorPageElementStyleSettingsPlugin
];
