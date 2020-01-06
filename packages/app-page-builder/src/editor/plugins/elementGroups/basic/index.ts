// @flow
import React from "react";
import { ReactComponent as TextIcon } from "@webiny/app-page-builder/editor/assets/icons/round-text_format-24px.svg";
import type { PbElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

const basicGroup: PbElementGroupPlugin = {
    name: "pb-editor-element-group-basic",
    type: "pb-editor-page-element-group",
    group: {
        title: "Basic",
        icon: <TextIcon />
    }
};

export default basicGroup;
