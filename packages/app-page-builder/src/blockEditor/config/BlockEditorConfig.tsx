import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";

export const BlockEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <ElementSettingsTabContentPlugin />
        </>
    );
});

BlockEditorConfig.displayName = "BlockEditorConfig";
