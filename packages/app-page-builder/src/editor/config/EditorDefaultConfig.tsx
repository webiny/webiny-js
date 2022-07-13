import React from "react";
import { ResponsiveModeSelectorModule } from "./ResponsiveModeSelector";
import { BreadcrumbsPlugin } from "./Breadcrumbs";
import { BackgroundPlugin } from "./Background";
import { ActionPlugins } from "./ActionPlugins";

export const EditorDefaultConfig = () => {
    return (
        <>
            <ActionPlugins />
            <ResponsiveModeSelectorModule />
            <BreadcrumbsPlugin />
            <BackgroundPlugin />
        </>
    );
};
