import React from "react";
import { ReactComponent as TextIcon } from "../../../assets/icons/round-text_format-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

const basicGroup: PbEditorPageElementGroupPlugin = {
    name: "pb-editor-element-group-basic",
    type: "pb-editor-page-element-group",
    group: {
        title: "Basic",
        icon: <TextIcon />
    }
};

export default basicGroup;
