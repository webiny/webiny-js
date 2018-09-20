// @flow
import React from "react";
import { ReactComponent as TextIcon } from "webiny-app-cms/editor/assets/icons/round-text_format-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

const textGroup: ElementGroupPluginType = {
    name: "cms-element-group-text",
    type: "cms-element-group",
    group: {
        name: "text",
        title: "Text",
        icon: <TextIcon/>
    }
};

export default textGroup;