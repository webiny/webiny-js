import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";
import { ToolbarActionsPlugin } from "./ToolbarActionsPlugin";

export const BlockEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <ElementSettingsTabContentPlugin />
            <ToolbarActionsPlugin />
        </>
    );
});

BlockEditorConfig.displayName = "BlockEditorConfig";
