import React from "react";
import { ReactComponent as LayoutIcon } from "@webiny/app-page-builder/editor/assets/icons/round-view_quilt-24px.svg";
import { PbEditorPageElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

const layoutGroup: PbEditorPageElementGroupPlugin = {
    name: "pb-editor-element-group-layout",
    type: "pb-editor-page-element-group",
    group: {
        title: "Layout",
        icon: <LayoutIcon />
    }
};

export default layoutGroup;
