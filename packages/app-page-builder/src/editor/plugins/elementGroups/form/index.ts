// @flow
import React from "react";
import { ReactComponent as FormIcon } from "./round-developer_board-24px.svg";
import type { PbElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

export default ({
    type: "pb-editor-page-element-group",
    name: "pb-editor-element-group-form",
    group: {
        title: "Form",
        icon: <FormIcon />
    }
}: PbElementGroupPlugin);
