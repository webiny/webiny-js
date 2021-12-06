import React from "react";
import { ReactComponent as ImageGroupIcon } from "../../../assets/icons/round-collections-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-image",
    group: {
        title: "Image",
        icon: <ImageGroupIcon />
    }
});
