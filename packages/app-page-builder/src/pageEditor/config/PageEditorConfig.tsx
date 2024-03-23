import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "./blockEditing";
import { BlockElementSidebarPlugin } from "./BlockElementSidebarPlugin";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";
// import { ToolbarActionsPlugin } from "./ToolbarActionsPlugin";

export const PageEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <BlockEditingPlugin />
            <BlockElementSidebarPlugin />
            <ElementSettingsTabContentPlugin />
            {/* TODO: <ToolbarActionsPlugin />*/}
        </>
    );
});

PageEditorConfig.displayName = "PageEditorConfig";
