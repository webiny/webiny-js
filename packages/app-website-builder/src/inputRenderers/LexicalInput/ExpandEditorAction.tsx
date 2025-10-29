import React from "react";
import { useExpandedEditor } from "./ExpandedEditor.js";

export const ExpandEditorAction = () => {
    const { setExpanded } = useExpandedEditor();

    return (
        <button
            onClick={() => setExpanded(expanded => !expanded)}
            className={"popup-item absolute right-0 z-1"}
            aria-label="Expand editor"
        >
            <i className="format expand" />
        </button>
    );
};
