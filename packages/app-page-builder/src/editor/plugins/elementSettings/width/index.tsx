import React from "react";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";
import { ReactComponent as WidthIcon } from "./arrows-alt-h-solid.svg";
import Settings from "./Settings";
import Action from "../components/Action";
import WidthSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/width/WidthSettings";

export default {
    name: "pb-editor-page-element-settings-width",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Width"} plugin={this.name} icon={<WidthIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    },
    render() {
        return <WidthSettings />;
    }
} as PbEditorPageElementSettingsPlugin;
