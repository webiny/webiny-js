import React from "react";

export default () => {
    return {
        name: "cms-render-slate-editor-link",
        type: "cms-render-slate-editor",
        slate: {
            renderNode(props, next) {
                const { attributes, children, node } = props;

                if (node.type === "link") {
                    const { data } = node;
                    const href = data.get("href");
                    const noFollow = data.get("noFollow");
                    return (
                        <a {...attributes} {...{ href, rel: noFollow ? "nofollow" : null }}>
                            {children}
                        </a>
                    );
                }

                return next();
            }
        }
    };
};
