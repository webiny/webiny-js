import React from "react";
import { ReactComponent as WidthIcon } from "./arrows-alt-h-solid.svg";

import Settings from "./Settings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-page-element-settings-column-width",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Width"} plugin={this.name} icon={<WidthIcon />} />;
    },
    renderMenu() {
        return <Settings />;
    }
} as PbEditorPageElementSettingsPlugin;
