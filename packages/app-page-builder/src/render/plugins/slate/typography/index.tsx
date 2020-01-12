import React from "react";
import { PbRenderSlateEditorPlugin } from "@webiny/app-page-builder/types";

/**
 * TODO: figure out why slate typings are not really working here (see all the @ts-ignore lines)
 * Maybe I'm doing something wrong; if anybody knows - please help!
 */

export default (): PbRenderSlateEditorPlugin => {
    return {
        name: "pb-render-slate-editor-typography",
        type: "pb-render-slate-editor",
        slate: {
            renderNode(props, next) {
                const { attributes, children, node, editor } = props;
                // @ts-ignore
                const { type } = node;

                // @ts-ignore
                const { typography } = editor.props.theme;

                if (typography.hasOwnProperty(type) && typography[type].component) {
                    const { component: Node, className = null } = typography[type];

                    let nodeProps = {
                        ...attributes,
                        className,
                        // @ts-ignore
                        style: { textAlign: `${node.data.get("align")}` }
                    };

                    if (typeof Node !== "string") {
                        // @ts-ignore
                        nodeProps = props;
                    }

                    return <Node {...nodeProps}>{children}</Node>;
                }

                return next();
            }
        }
    };
};
