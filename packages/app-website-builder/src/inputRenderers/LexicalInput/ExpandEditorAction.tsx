import React from "react";
import { useExpandedEditor } from "./ExpandedEditor.js";

export const ExpandEditorAction = () => {
    const { setExpanded } = useExpandedEditor();

    return (
        <button
            onClick={() => setExpanded(expanded => !expanded)}
            className={"popup-item absolute z-1"}
            style={{ right: 5 }}
            aria-label="Expand editor"
        >
            <i className="format expand" />
        </button>
    );
};
