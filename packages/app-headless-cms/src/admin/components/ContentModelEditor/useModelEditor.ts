import React from "react";
import { contentModelEditorContext } from "./ContentModelEditorProvider";

export function useModelEditor() {
    const context = React.useContext(contentModelEditorContext);
    if (!context) {
        throw new Error("useContentModelEditor must be used within a ContentModelEditorProvider");
    }

    return context;
}
