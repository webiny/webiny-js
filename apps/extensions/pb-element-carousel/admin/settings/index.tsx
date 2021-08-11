import React from "react";
import { CarouselSettings } from "./CarouselSettings";
import { PbEditorPageElementStyleSettingsPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-page-element-style-settings-carousel",
    type: "pb-editor-page-element-style-settings",
    render() {
        return <CarouselSettings />;
    }
} as PbEditorPageElementStyleSettingsPlugin;
