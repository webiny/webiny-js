import React from "react";
import { PbEditorPageElementGroupPlugin } from "@webiny/app-page-builder/types";
import { ReactComponent as DynamicIcon } from "./devices_other-black-24px.svg";

const dynamic: PbEditorPageElementGroupPlugin = {
    name: "pb-editor-element-group-dynamic",
    type: "pb-editor-page-element-group",
    group: {
        title: "Dynamic",
        icon: <DynamicIcon />
    }
};

export default dynamic;
