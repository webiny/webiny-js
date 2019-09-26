// @flow
import React from "react";

export default () => {
    return {
        name: "pb-render-slate-editor-italic",
        type: "pb-render-slate-editor",
        slate: {
            renderMark(props: Object, next: Function) {
                if (props.mark.type === "italic") {
                    return <em {...props.attributes}>{props.children}</em>;
                }
                return next();
            }
        }
    };
};
