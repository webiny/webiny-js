// @flow
import React from "react";

export default () => {
    return {
        name: "pb-render-slate-editor-underline",
        type: "pb-render-slate-editor",
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
