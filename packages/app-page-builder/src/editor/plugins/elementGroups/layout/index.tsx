import React from "react";
import { ReactComponent as LayoutIcon } from "../../../assets/icons/round-view_quilt-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-layout",
    group: {
        title: "Layout",
        icon: <LayoutIcon />
    }
});
