import React from "react";
import { contentModelEditorContext } from "./Context";

export function useContentModelEditor() {
    const context = React.useContext(contentModelEditorContext);
    if (!context) {
        throw new Error("useContentModelEditor must be used within a ContentModelEditorProvider");
    }

    return context;
}
