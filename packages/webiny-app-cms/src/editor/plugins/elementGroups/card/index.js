// @flow
import React from "react";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

const cardGroup: ElementGroupPluginType = {
    name: "cms-element-group-card",
    type: "cms-element-group",
    group: {
        name: "card",
        title: "Card",
        icon: null
    }
};

export default cardGroup;