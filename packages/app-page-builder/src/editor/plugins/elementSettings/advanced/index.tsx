import React from "react";
import { advancedSettingsEditorAction } from "./advancedSettingsEditorAction";
import { CreateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { ReactComponent as SettingsIcon } from "@webiny/app-page-builder/editor/assets/icons/settings.svg";
import AdvancedSettings from "./AdvancedSettings";
import Action from "../components/Action";
import AdvancedAction from "./AdvancedAction";
import {
    PbEditorContentPlugin,
    PbEditorPageElementSettingsPlugin,
    PbEditorEventActionPlugin
} from "@webiny/app-page-builder/types";

export default [
    {
        name: "pb-editor-content-element-advanced-settings",
        type: "pb-editor-content",
        render() {
            return <AdvancedSettings />;
        }
    } as PbEditorContentPlugin,
    {
        name: "pb-editor-event-action-advanced-settings",
        type: "pb-editor-event-action-plugin",
        onEditorMount(handler) {
            return handler.on(CreateElementActionEvent, advancedSettingsEditorAction);
        }
    } as PbEditorEventActionPlugin,
    {
        name: "pb-editor-page-element-settings-advanced",
        type: "pb-editor-page-element-settings",
        renderAction() {
            return (
                <AdvancedAction>
                    <Action
                        plugin={this.name}
                        icon={<SettingsIcon />}
                        data-testid={"pb-editor-advanced-settings-button"}
                        tooltip={"Advanced settings"}
                    />
                </AdvancedAction>
            );
        }
    } as PbEditorPageElementSettingsPlugin
];
