import React from "react";
import { PbRenderSlateEditorPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderSlateEditorPlugin => {
    return {
        name: "pb-render-slate-editor-italic",
        type: "pb-render-slate-editor",
        slate: {
            renderMark(props, next) {
                if (props.mark.type === "italic") {
                    return <em {...props.attributes}>{props.children}</em>;
                }
                return next();
            }
        }
    };
};
