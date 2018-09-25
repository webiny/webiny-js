// @flow
import React from "react";

export default () => {
    return {
        name: "italic",
        type: "cms-slate-editor",
        slate: {
            renderMark(props: Object) {
                if (props.mark.type === "italic") {
                    return <em {...props.attributes}>{props.children}</em>;
                }
            }
        }
    };
};
