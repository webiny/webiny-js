// @flow
import React from "react";

export default () => {
    return {
        name: "cms-render-slate-editor-bold",
        type: "cms-render-slate-editor",
        slate: {
            renderMark(props: Object) {
                if (props.mark.type === "bold") {
                    return <strong {...props.attributes}>{props.children}</strong>;
                }
            }
        }
    };
};
