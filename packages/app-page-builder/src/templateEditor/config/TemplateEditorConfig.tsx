import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "~/pageEditor/config/blockEditing";
import { BlockElementSidebarPlugin } from "~/templateEditor/config/BlockElementSidebarPlugin";
// import { ToolbarActionsPlugin } from "~/blockEditor/config/ToolbarActionsPlugin";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";

export const TemplateEditorConfig = React.memo(() => {
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

TemplateEditorConfig.displayName = "TemplateEditorConfig";
