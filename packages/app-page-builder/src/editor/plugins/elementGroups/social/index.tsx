import React from "react";
import { ReactComponent as SocialIcon } from "./round-people-24px.svg";
import { PbEditorPageElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-element-group-social",
    type: "pb-editor-page-element-group",
    group: {
        title: "Social",
        icon: <SocialIcon />
    }
} as PbEditorPageElementGroupPlugin;
