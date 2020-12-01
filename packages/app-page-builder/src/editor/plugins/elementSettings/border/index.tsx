import React from "react";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";
// Icon
import { ReactComponent as BorderIcon } from "../../../assets/icons/border_outer.svg";
// Components
import Action from "../components/Action";
import Settings from "./Settings";
import BorderSettings from "./BorderSettings";

export default {
    name: "pb-editor-page-element-settings-border",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Border"} plugin={this.name} icon={<BorderIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    },
    render() {
        return <BorderSettings />;
    }
} as PbEditorPageElementSettingsPlugin;
