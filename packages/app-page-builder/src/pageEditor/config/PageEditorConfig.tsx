import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "./blockEditing";
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
            <DataSettingsSidebarTabsPlugin />
            <BlockElementSidebarPlugin />
            <ElementSettingsTabContentPlugin />
            <ToolbarActionsPlugin />
        </>
    );
});

PageEditorConfig.displayName = "PageEditorConfig";
