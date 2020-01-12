import * as React from "react";
import Breadcrumbs from "./Breadcrumbs";
import { PbEditorContentPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-breadcrumbs",
    type: "pb-editor-content",
    render() {
        return <Breadcrumbs />;
    }
} as PbEditorContentPlugin;
