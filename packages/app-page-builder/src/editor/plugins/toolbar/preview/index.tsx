import * as React from "react";
import { ReactComponent as ActiveIcon } from "./round-visibility_off-24px.svg";
import { ReactComponent as InactiveIcon } from "./round-visibility-24px.svg";
import Action from "../Action";
import { PbEditorToolbarTopPlugin } from "@webiny/app-page-builder/admin/types";

// eslint-disable-next-line
const icons = [<ActiveIcon />, <InactiveIcon />];

export default {
    name: "pb-editor-toolbar-preview",
    type: "pb-editor-toolbar-top",
    renderAction() {
        return <Action plugin={this.name} icon={icons} tooltip={"Preview"} />;
    }
} as PbEditorToolbarTopPlugin;
