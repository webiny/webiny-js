import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { DefaultBlockEditorConfig } from "./DefaultBlockEditorConfig";
import { DefaultEditorConfig } from "~/editor";

export const BlockEditorConfig = React.memo(() => {
    return (
        <>
            <DefaultEditorConfig />
            <EventActionHandlerPlugin />
            <EventActionPlugins />
            <DefaultBlockEditorConfig />
        </>
    );
});

BlockEditorConfig.displayName = "BlockEditorConfig";
