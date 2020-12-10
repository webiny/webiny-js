import React from "react";
import { advancedSettingsEditorAction } from "./advancedSettingsEditorAction";
import { CreateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import AdvancedSettings from "./AdvancedSettings";
import {
    PbEditorEventActionPlugin,
    PbEditorSidebarContentPlugin
} from "@webiny/app-page-builder/types";

export default [
    {
        name: "pb-editor-sidebar-content-element-advanced-settings",
        type: "pb-editor-sidebar-content",
        render() {
            return <AdvancedSettings />;
        }
    } as PbEditorSidebarContentPlugin,
    {
        name: "pb-editor-event-action-advanced-settings",
        type: "pb-editor-event-action-plugin",
        onEditorMount(handler) {
            return handler.on(CreateElementActionEvent, advancedSettingsEditorAction);
        }
    } as PbEditorEventActionPlugin
];
