import React from "react";
import { ReactComponent as SavedIcon } from "@webiny/app-page-builder/editor/assets/icons/round-favorite-24px.svg";
import { PbEditorPageElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-element-group-saved",
    type: "pb-editor-page-element-group",
    group: {
        title: "Saved",
        icon: <SavedIcon />
    }
} as PbEditorPageElementGroupPlugin;
