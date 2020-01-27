import React from "react";
import { ReactComponent as LinkIcon } from "./round-link-24px.svg";
import LinkSettings from "./LinkSettings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-page-element-settings-link",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action plugin={this.name} tooltip={"Link"} icon={<LinkIcon />} />;
    },
    renderMenu() {
        return <LinkSettings />;
    }
} as PbEditorPageElementSettingsPlugin;
