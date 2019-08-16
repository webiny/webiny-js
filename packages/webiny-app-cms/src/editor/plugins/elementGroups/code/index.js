// @flow
import React from "react";
import { ReactComponent as CodeIcon } from "./code.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-editor-element-group-code",
    type: "pb-editor-element-group",
    group: {
        title: "Code",
        icon: <CodeIcon />
    }
}: ElementGroupPluginType);
