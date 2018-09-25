import React from "react";

export default () => {
    return {
        name: "cms-render-slate-editor-link",
        type: "cms-render-slate-editor",
        slate: {
            renderNode(props) {
                const { attributes, children, node } = props;

                if (node.type === "link") {
                    const { data } = node;
                    const href = data.get("href");
                    return (
                        <a {...attributes} href={href}>
                            {children}
                        </a>
                    );
                }
            }
        }
    }
};
