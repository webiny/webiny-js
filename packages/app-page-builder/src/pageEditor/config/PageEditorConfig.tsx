import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { ImageContainerPlugin, ImagesListPlugin } from "./elements";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "./blockEditing";
import { BlockElementPlugin } from "./BlockElementPlugin";
import { DataSettingsSidebarTabsPlugin } from "./DataSettingsSidebarTabsPlugin";
import { BlockElementSidebarPlugin } from "./BlockElementSidebarPlugin";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";
import { ToolbarActionsPlugin } from "./ToolbarActionsPlugin";

export const PageEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <BlockEditingPlugin />
            <BlockElementPlugin />
            <DataSettingsSidebarTabsPlugin />
            <BlockElementSidebarPlugin />
            <ElementSettingsTabContentPlugin />
            <ImageContainerPlugin />
            <ImagesListPlugin />
            <ToolbarActionsPlugin />
        </>
    );
});

PageEditorConfig.displayName = "PageEditorConfig";
