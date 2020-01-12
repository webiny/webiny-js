import React from "react";
import {PbRenderSlateEditorPlugin} from "@webiny/app-page-builder/types";

export default (): PbRenderSlateEditorPlugin => {
    return {
        name: "pb-render-slate-editor-code",
        type: "pb-render-slate-editor",
        slate: {
            renderMark(props, next) {
                if (props.mark.type === "code") {
                    return (
                        <code className={"webiny-pb-typography-code"} {...props.attributes}>
                            {props.children}
                        </code>
                    );
                }

                return next();
            }
        }
    };
};
