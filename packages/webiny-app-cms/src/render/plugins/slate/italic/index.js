// @flow
import React from "react";

export default () => {
    return {
        name: "italic",
        type: "cms-slate-editor",
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
