// @flow
import React from "react";

export default () => {
    return {
        name: "pb-render-slate-editor-typography",
        type: "pb-render-slate-editor",
        slate: {
            renderNode(props: Object, next: Function) {
                const { attributes, children, node, editor } = props;
                let { type } = node;

                const { typography } = editor.props.theme;

                if (typography.hasOwnProperty(type) && typography[type].component) {
                    const { component: Node, className = null } = typography[type];

                    let nodeProps = {
                        ...attributes,
                        className,
                        style: { textAlign: `${node.data.get("align")}` }
                    };

                    if (typeof Node !== "string") {
                        nodeProps = props;
                    }

                    return <Node {...nodeProps}>{children}</Node>;
                }

                return next();
            }
        }
    };
};
