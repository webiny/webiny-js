// @flow
import React from "react";

export default () => {
    return {
        name: "pb-render-slate-editor-code",
        type: "pb-render-slate-editor",
        slate: {
            renderMark(props: Object, next: Function) {
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
