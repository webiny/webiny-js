// @flow
import React from "react";
import { ReactComponent as FormIcon } from "./round-developer_board-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    type: "cms-element-group",
    name: "cms-element-group-form",
    group: {
        name: "form",
        title: "Form",
        icon: <FormIcon />
    }
}: ElementGroupPluginType);
