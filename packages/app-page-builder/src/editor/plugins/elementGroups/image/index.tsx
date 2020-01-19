import React from "react";
import { ReactComponent as ImageGroupIcon } from "@webiny/app-page-builder/editor/assets/icons/round-collections-24px.svg";
import { PbEditorPageElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

const imageGroup: PbEditorPageElementGroupPlugin = {
    name: "pb-editor-element-group-image",
    type: "pb-editor-page-element-group",
    group: {
        title: "Image",
        icon: <ImageGroupIcon />
    }
};

export default imageGroup;
