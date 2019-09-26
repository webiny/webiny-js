// @flow
import React from "react";
import { ReactComponent as ImageGroupIcon } from "@webiny/app-page-builder/editor/assets/icons/round-collections-24px.svg";
import type { PbElementGroupPluginType } from "@webiny/app-page-builder/types";

const imageGroup: PbElementGroupPluginType = {
    name: "pb-editor-element-group-image",
    type: "pb-editor-page-element-group",
    group: {
        title: "Image",
        icon: <ImageGroupIcon />
    }
};

export default imageGroup;
