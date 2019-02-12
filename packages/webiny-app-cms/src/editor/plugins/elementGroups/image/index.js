// @flow
import React from "react";
import { ReactComponent as ImageGroupIcon } from "webiny-app-cms/editor/assets/icons/round-collections-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

const imageGroup: ElementGroupPluginType = {
    name: "cms-element-group-image",
    type: "cms-element-group",
    group: {
        title: "Image",
        icon: <ImageGroupIcon/>
    }
};

export default imageGroup;