import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "./blockEditing";
import { BlockElementPlugin } from "./BlockElementPlugin";
import { BlockElementSidebarPlugin } from "./BlockElementSidebarPlugin";

export const PageEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <BlockEditingPlugin />
            <BlockElementPlugin />
            <BlockElementSidebarPlugin />
        </>
    );
});

PageEditorConfig.displayName = "PageEditorConfig";
