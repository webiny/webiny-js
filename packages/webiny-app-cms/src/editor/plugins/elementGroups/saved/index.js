// @flow
import React from "react";
import { ReactComponent as SavedIcon } from "webiny-app-cms/editor/assets/icons/round-favorite-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-element-group-saved",
    type: "cms-element-group",
    group: {
        name: "saved",
        title: "Saved",
        icon: <SavedIcon/>
    }
}: ElementGroupPluginType);