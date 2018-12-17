// @flow
import React from "react";

export default () => {
    return {
        name: "cms-render-slate-editor-code",
        type: "cms-render-slate-editor",
        slate: {
            renderMark(props: Object, next: Function) {
                if (props.mark.type === "code") {
                    return (
                        <code
                            className={"webiny-cms-typography-code"}
                            {...props.attributes}
                        >
                            {props.children}
                        </code>
                    );
                }

                return next();
            }
        }
    };
};
