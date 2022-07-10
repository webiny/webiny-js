import React from "react";
import { ResponsiveModeSelectorModule } from "./ResponsiveModeSelector";
import { BreadcrumbsPlugin } from "./Breadcrumbs";
import { BackgroundPlugin } from "./Background";

export const EditorDefaultConfig = () => {
    return (
        <>
            <ResponsiveModeSelectorModule />
            <BreadcrumbsPlugin />
            <BackgroundPlugin />
        </>
    );
};
