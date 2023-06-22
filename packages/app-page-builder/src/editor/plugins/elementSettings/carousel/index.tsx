import React from "react";
import CarouselItems from "./Carousel";
import { PbEditorPageElementAdvancedSettingsPlugin } from "~/types";

export default {
    name: "pb-editor-page-element-advanced-settings-carousel",
    type: "pb-editor-page-element-advanced-settings",
    elementType: "carousel",
    render() {
        return <CarouselItems />;
    }
} as PbEditorPageElementAdvancedSettingsPlugin;
