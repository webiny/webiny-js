// @flow
import React from "react";

export default () => {
    return {
        name: "typography",
        type: "cms-render-slate-editor",
        slate: {
            renderNode(props: Object) {
                const { attributes, children, node, editor } = props;
                let { type } = node;

                const { styles } = editor.props.theme;

                if (styles.hasOwnProperty(type) && styles[type].component) {
                    const { component: Node, className = null } = styles[type];

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
            }
        }
    };
};
