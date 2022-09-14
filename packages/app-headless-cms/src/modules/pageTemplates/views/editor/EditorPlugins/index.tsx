import React from "react";
import { SidebarPlugin } from "./SidebarPlugin";
import { ContentTabsPlugin } from "./ContentTabsPlugin";

export const EditorPlugins: React.FC = () => {
    return (
        <>
            <SidebarPlugin />
            <ContentTabsPlugin />
        </>
    );
};
