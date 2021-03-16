import React from "react";
import Background from "./Background";
import { PbEditorContentPlugin } from "../../../types";

export default {
    name: "pb-editor-content-background",
    type: "pb-editor-content",
    render() {
        return <Background />;
    }
} as PbEditorContentPlugin;
