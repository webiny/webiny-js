import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";
import { ToolbarActionsPlugin } from "./ToolbarActionsPlugin";
import { DefaultBlockEditorConfig } from "./DefaultBlockEditorConfig";

export const BlockEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EventActionPlugins />
            <ElementSettingsTabContentPlugin />
            <ToolbarActionsPlugin />
            <DefaultBlockEditorConfig />
        </>
    );
});

BlockEditorConfig.displayName = "BlockEditorConfig";
