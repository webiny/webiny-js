import React from "react";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";
// Components
import Action from "../components/Action";
import Settings from "../components/PMSettings";
import MarginSettings from "../components/MarginPaddingSettings";
// Icon
import { ReactComponent as MarginIcon } from "@webiny/app-page-builder/editor/assets/icons/fullscreen.svg";

export default {
    name: "pb-editor-page-element-settings-margin",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Margin"} plugin={this.name} icon={<MarginIcon />} />;
    },
    renderMenu() {
        return <Settings title="Margin" styleAttribute="margin" />;
    },
    render() {
        return <MarginSettings styleAttribute={"margin"} />;
    }
} as PbEditorPageElementSettingsPlugin;
