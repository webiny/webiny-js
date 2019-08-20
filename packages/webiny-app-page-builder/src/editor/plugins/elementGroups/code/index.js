// @flow
import React from "react";
import { ReactComponent as CodeIcon } from "./code.svg";
import type { PbElementGroupPluginType } from "webiny-app-page-builder/types";

export default ({
    name: "pb-editor-element-group-code",
    type: "pb-editor-page-element-group",
    group: {
        title: "Code",
        icon: <CodeIcon />
    }
}: PbElementGroupPluginType);
