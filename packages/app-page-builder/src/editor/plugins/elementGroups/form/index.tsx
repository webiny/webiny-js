import React from "react";
import { ReactComponent as FormIcon } from "./round-developer_board-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-form",
    group: {
        title: "Form",
        icon: <FormIcon />
    }
});
