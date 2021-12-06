import React from "react";
import { ReactComponent as CodeIcon } from "./code.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-code",
    group: {
        title: "Code",
        icon: <CodeIcon />
    }
});
