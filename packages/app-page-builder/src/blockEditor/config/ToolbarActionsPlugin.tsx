import React from "react";
import { ToolbarActions } from "~/editor";
import { createDecorator } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { renderPlugin } from "~/editor/components/Editor/Toolbar";
import { PbEditorToolbarBottomPlugin, PbEditorToolbarTopPlugin } from "~/types";

export const ToolbarActionsPlugin = createDecorator(ToolbarActions, ToolbarActionsWrapper => {
    return function BlockEditorToolbarActions() {
        const actionsTop = plugins.byType<PbEditorToolbarTopPlugin>("pb-editor-toolbar-top");
        const actionsBottom = plugins
            .byType<PbEditorToolbarBottomPlugin>("pb-editor-toolbar-bottom")
            .filter(plugin => plugin.name !== "pb-editor-toolbar-save");

        return (
            <ToolbarActionsWrapper>
                <div>{actionsTop.map(renderPlugin)}</div>
                <div>{actionsBottom.map(renderPlugin)}</div>
            </ToolbarActionsWrapper>
        );
    };
});
