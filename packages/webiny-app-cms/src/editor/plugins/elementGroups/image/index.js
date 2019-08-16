// @flow
import React from "react";
import { ReactComponent as ImageGroupIcon } from "webiny-app-cms/editor/assets/icons/round-collections-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

const imageGroup: ElementGroupPluginType = {
    name: "pb-editor-element-group-image",
    type: "pb-editor-element-group",
    group: {
        title: "Image",
        icon: <ImageGroupIcon/>
    }
};

export default imageGroup;