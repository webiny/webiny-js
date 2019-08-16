// @flow
import React from "react";
import { ReactComponent as FormIcon } from "./round-developer_board-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    type: "pb-editor-element-group",
    name: "pb-editor-element-group-form",
    group: {
        title: "Form",
        icon: <FormIcon />
    }
}: ElementGroupPluginType);
