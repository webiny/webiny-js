import React from "react";
import { css } from "emotion";
import { PbRenderSlateEditorPlugin } from "@webiny/app-page-builder/types";

// @ts-ignore
const strongStyle = css({
    "[class*='mdc-typography--']": {
        fontWeight: "bold !important"
    }
});

export default (): PbRenderSlateEditorPlugin => ({
    name: "pb-render-slate-editor-bold",
    type: "pb-render-slate-editor",
    slate: {
        renderMark(props, next) {
            if (props.mark.type === "bold") {
                return (
                    <strong className={strongStyle} {...props.attributes}>
                        {props.children}
                    </strong>
                );
            }

            return next();
        }
    }
});
