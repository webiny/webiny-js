// @flow
import React from "react";
import { ReactComponent as LayoutIcon } from "webiny-app-page-builder/editor/assets/icons/round-view_quilt-24px.svg";
import type { PbElementGroupPluginType } from "webiny-app-page-builder/types";

const layoutGroup: PbElementGroupPluginType = {
    name: "pb-editor-element-group-layout",
    type: "pb-editor-page-element-group",
    group: {
        title: "Layout",
        icon: <LayoutIcon/>
    }
};

export default layoutGroup;