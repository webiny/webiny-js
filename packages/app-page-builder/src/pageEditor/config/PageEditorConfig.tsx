import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { ImageContainerPlugin, ImagesListPlugin } from "./elements";
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
            <ImageContainerPlugin />
            <ImagesListPlugin />
        </>
    );
});

PageEditorConfig.displayName = "PageEditorConfig";
