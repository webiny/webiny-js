import kebabCase from "lodash/kebabCase";
import Image from "./Image";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createImage } from "@webiny/app-page-builder-elements/renderers/image";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";
import { Link } from "@webiny/react-router";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? props => <Image {...props} />
    : createImage({
          linkComponent: ({ href, children, ...rest }) => {
              return (
                  <Link to={href!} {...rest}>
                      {children}
                  </Link>
              );
          }
      });

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "image");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
