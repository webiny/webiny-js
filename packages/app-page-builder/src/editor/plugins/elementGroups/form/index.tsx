import React from "react";
import { ReactComponent as FormIcon } from "@material-design-icons/svg/outlined/developer_board.svg";
import { PbEditorPageElementGroupPlugin } from "~/types";

export default {
    type: "pb-editor-page-element-group",
    name: "pb-editor-element-group-form",
    group: {
        title: "Form",
        icon: <FormIcon />
    }
} as PbEditorPageElementGroupPlugin;
