import React from "react";
import { PbRenderSlateEditorPlugin } from "@webiny/app-page-builder/types";
import { Link } from "@webiny/react-router";

export default (): PbRenderSlateEditorPlugin => {
    return {
        name: "pb-render-slate-editor-link",
        type: "pb-render-slate-editor",
        slate: {
            renderNode(props, next) {
                const { attributes, children, node } = props;

                // @ts-ignore
                if (node.type === "link") {
                    // @ts-ignore
                    const { data } = node;
                    const href = data.get("href");
                    const noFollow = data.get("noFollow");
                    const newTab = data.get("newTab");

                    return (
                        <Link
                            to={href}
                            {...attributes}
                            rel={noFollow ? "nofollow" : null}
                            target={newTab ? "_blank" : "_self"}
                        >
                            {children}
                        </Link>
                    );
                }

                return next();
            }
        }
    };
};
