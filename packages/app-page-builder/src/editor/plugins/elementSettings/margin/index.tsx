import React from "react";
import { ReactComponent as MarginIcon } from "@webiny/app-page-builder/editor/assets/icons/fullscreen.svg";
import Settings from "../components/PMSettings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-page-element-settings-margin",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return (
            <Action tooltip={"Margin"} plugin={this.name} icon={<MarginIcon />} />
        );
    },
    renderMenu() {
        return <Settings title="Margin" styleAttribute="margin" />;
    }
} as PbEditorPageElementSettingsPlugin;
