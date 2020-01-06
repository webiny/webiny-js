// @flow
import React from "react";
import { ReactComponent as CodeIcon } from "./code.svg";
import type { PbElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

export default ({
    name: "pb-editor-element-group-code",
    type: "pb-editor-page-element-group",
    group: {
        title: "Code",
        icon: <CodeIcon />
    }
}: PbElementGroupPlugin);
