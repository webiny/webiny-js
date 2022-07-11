import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { BlockElementSidebarPlugin } from "./BlockElementSidebar";

export const BlockEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <BlockElementSidebarPlugin />
        </>
    );
});

BlockEditorConfig.displayName = "BlockEditorConfig";
