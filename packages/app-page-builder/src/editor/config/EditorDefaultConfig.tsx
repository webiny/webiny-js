import React from "react";
import { ResponsiveModeSelectorPlugin } from "./ResponsiveModeSelector";
import { BreadcrumbsPlugin } from "./Breadcrumbs";
import { BackgroundPlugin } from "./Background";
import { ActionPlugins } from "./ActionPlugins";

export const EditorDefaultConfig = () => {
    return (
        <>
            <ActionPlugins />
            <ResponsiveModeSelectorPlugin />
            <BreadcrumbsPlugin />
            <BackgroundPlugin />
        </>
    );
};
