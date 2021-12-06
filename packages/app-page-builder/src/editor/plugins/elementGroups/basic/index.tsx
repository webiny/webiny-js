import React from "react";
import { ReactComponent as TextIcon } from "../../../assets/icons/round-text_format-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-basic",
    group: {
        title: "Basic",
        icon: <TextIcon />
    }
});
