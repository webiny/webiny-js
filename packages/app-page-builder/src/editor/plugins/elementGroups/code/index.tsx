import React from "react";
import { ReactComponent as CodeIcon } from "./code.svg";
import { PbElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-element-group-code",
    type: "pb-editor-page-element-group",
    group: {
        title: "Code",
        icon: <CodeIcon />
    }
} as PbElementGroupPlugin;
