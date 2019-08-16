// @flow
import React from "react";
import { ReactComponent as TextIcon } from "webiny-app-cms/editor/assets/icons/round-text_format-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

const basicGroup: ElementGroupPluginType = {
    name: "pb-editor-element-group-basic",
    type: "pb-editor-element-group",
    group: {
        title: "Basic",
        icon: <TextIcon />
    }
};

export default basicGroup;
