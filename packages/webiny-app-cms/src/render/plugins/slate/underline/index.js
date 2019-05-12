// @flow
import React from "react";

export default () => {
    return {
        name: "cms-render-slate-editor-underline",
        type: "cms-render-slate-editor",
        slate: {
            renderMark(props: Object, next: Function) {
                if (props.mark.type === "underline") {
                    return <u {...props.attributes}>{props.children}</u>;
                }

                return next();
            }
        }
    };
};
