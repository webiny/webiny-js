import React from "react";
import { EventActionPlugins, EventActionHandlerPlugin } from "./eventActions";
import { EditorBarPlugins } from "./editorBar";
import { BlockEditingPlugin } from "~/pageEditor/config/blockEditing";
import { BlockElementSidebarPlugin } from "~/templateEditor/config/BlockElementSidebarPlugin";
import { ToolbarActionsPlugin } from "~/blockEditor/config/ToolbarActionsPlugin";
import { ElementSettingsTabContentPlugin } from "./ElementSettingsTabContentPlugin";
import { ContentPlugin } from "./ContentPlugin";
import { DataSettingsSidebarTabsPlugin } from "./DataSettingsSidebarTabsPlugin";

export const TemplateEditorConfig = React.memo(() => {
    return (
        <>
            <ContentPlugin />
            <DataSettingsSidebarTabsPlugin />
            <EventActionHandlerPlugin />
            <EditorBarPlugins />
            <EventActionPlugins />
            <BlockEditingPlugin />
            <BlockElementSidebarPlugin />
            <ElementSettingsTabContentPlugin />
            <ToolbarActionsPlugin />
        </>
    );
});

TemplateEditorConfig.displayName = "TemplateEditorConfig";
