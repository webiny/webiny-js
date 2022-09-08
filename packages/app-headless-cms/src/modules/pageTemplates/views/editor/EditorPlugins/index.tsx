import React from "react";
import { SidebarPlugin } from "./SidebarPlugin";
import { ContentTabsPlugin } from "./ContentTabsPlugin";

export const EditorPlugins = () => {
    return (
        <>
            <SidebarPlugin />
            <ContentTabsPlugin />
        </>
    );
};
