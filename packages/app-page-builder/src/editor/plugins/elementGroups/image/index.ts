// @flow
import React from "react";
import { ReactComponent as ImageGroupIcon } from "@webiny/app-page-builder/editor/assets/icons/round-collections-24px.svg";
import type { PbElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

const imageGroup: PbElementGroupPlugin = {
    name: "pb-editor-element-group-image",
    type: "pb-editor-page-element-group",
    group: {
        title: "Image",
        icon: <ImageGroupIcon />
    }
};

export default imageGroup;
