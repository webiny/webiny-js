import * as React from "react";
import Breadcrumbs from "./Breadcrumbs";
import { PbEditorContentPlugin } from "~/types";

const plugin: PbEditorContentPlugin = {
    name: "pb-editor-breadcrumbs",
    type: "pb-editor-content",
    render() {
        return <Breadcrumbs />;
    }
};
export default plugin;
