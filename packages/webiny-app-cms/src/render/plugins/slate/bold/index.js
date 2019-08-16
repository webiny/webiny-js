// @flow
import React from "react";
import { css } from "react-emotion";

const strongStyle = css({
    "[class*='mdc-typography--']": {
        fontWeight: "bold !important"
    }
});

export default () => {
    return {
        name: "pb-render-slate-editor-bold",
        type: "pb-render-slate-editor",
        slate: {
            renderMark(props: Object, next: Function) {
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
    };
};
