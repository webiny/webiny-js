import React from "react";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createImage } from "@webiny/app-page-builder-elements/renderers/image";

import { Link } from "@webiny/react-router";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "image");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render: createImage({
            linkComponent: ({ href, children, ...rest }) => {
                return (
                    <Link to={href!} {...rest}>
                        {children}
                    </Link>
                );
            }
        })
    };
};
