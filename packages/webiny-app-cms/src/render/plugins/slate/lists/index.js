// @flow
import React from "react";

export default () => {
    return {
        name: "cms-render-slate-editor-lists",
        type: "cms-render-slate-editor",
        slate: {
            renderNode(props: Object, next: Function) {
                const { attributes, children, node } = props;

                switch (node.type) {
                    case "unordered-list":
                        return (
                            <ul className={"webiny-cms-typography-unordered-list"} {...attributes}>
                                {children}
                            </ul>
                        );
                    case "list-item":
                        return <li {...attributes}>{children}</li>;
                    case "ordered-list":
                        return (
                            <ol className={"webiny-cms-typography-ordered-list"} {...attributes}>
                                {children}
                            </ol>
                        );
                    default:
                        return next();
                }
            }
        }
    };
};
