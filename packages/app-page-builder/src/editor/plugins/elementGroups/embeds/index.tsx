import React from "react";
import { ReactComponent as EmbedsIcon } from "./embeds.svg";
import { PbEditorPageElementGroupPlugin } from "~/types";

export default {
    name: "pb-editor-element-group-embeds",
    type: "pb-editor-page-element-group",
    group: {
        title: "Embeds",
        icon: <EmbedsIcon />
    }
} as PbEditorPageElementGroupPlugin;
