// @flow
import React from "react";
import { ReactComponent as SavedIcon } from "webiny-app-cms/editor/assets/icons/round-favorite-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-editor-element-group-saved",
    type: "pb-editor-element-group",
    group: {
        title: "Saved",
        icon: <SavedIcon />
    }
}: ElementGroupPluginType);
