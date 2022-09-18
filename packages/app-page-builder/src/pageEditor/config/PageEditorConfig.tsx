import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "./blockEditing";
import { BlockElementPlugin } from "./BlockElementPlugin";
import { BlockElementSidebarPlugin } from "./BlockElementSidebarPlugin";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";

export const PageEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <BlockEditingPlugin />
            <BlockElementPlugin />
            <BlockElementSidebarPlugin />
            <ElementSettingsTabContentPlugin />
        </>
    );
});

PageEditorConfig.displayName = "PageEditorConfig";
