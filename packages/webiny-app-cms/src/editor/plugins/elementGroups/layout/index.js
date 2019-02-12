// @flow
import React from "react";
import { ReactComponent as LayoutIcon } from "webiny-app-cms/editor/assets/icons/round-view_quilt-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

const layoutGroup: ElementGroupPluginType = {
    name: "cms-element-group-layout",
    type: "cms-element-group",
    group: {
        title: "Layout",
        icon: <LayoutIcon/>
    }
};

export default layoutGroup;