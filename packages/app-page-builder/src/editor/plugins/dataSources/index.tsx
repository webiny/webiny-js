import React from "react";
import LoadDataSources from "./LoadDataSources";
import { PbEditorContentPlugin } from "@webiny/app-page-builder/types";

export default (): PbEditorContentPlugin => ({
    name: "pb-editor-content-data-sources",
    type: "pb-editor-content",
    render() {
        return <LoadDataSources />;
    }
});
