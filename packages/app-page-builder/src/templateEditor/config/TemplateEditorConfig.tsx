import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { ImageContainerPlugin, ImagesListPlugin } from "~/pageEditor/config/elements";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "~/pageEditor/config/blockEditing";
import { BlockElementPlugin } from "~/pageEditor/config/BlockElementPlugin";
import { BlockElementSidebarPlugin } from "~/templateEditor/config/BlockElementSidebarPlugin";
import { ToolbarActionsPlugin } from "~/blockEditor/config/ToolbarActionsPlugin";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";

export const TemplateEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <BlockEditingPlugin />
            <BlockElementPlugin />
            <BlockElementSidebarPlugin />
            <ElementSettingsTabContentPlugin />
            <ImageContainerPlugin />
            <ImagesListPlugin />
            <ToolbarActionsPlugin />
        </>
    );
});

TemplateEditorConfig.displayName = "TemplateEditorConfig";
