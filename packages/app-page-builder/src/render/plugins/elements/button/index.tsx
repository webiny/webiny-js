import kebabCase from "lodash/kebabCase";
import Button from "./Button";
import {
    PbRenderElementPluginArgs,
    PbRenderElementPlugin,
    PbButtonElementClickHandlerPlugin
} from "~/types";
import { createButton } from "@webiny/app-page-builder-elements/renderers/button";
import { plugins } from "@webiny/plugins";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";
import { Link } from "@webiny/react-router";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? props => <Button {...props} />
    : createButton({
          clickHandlers: () => {
              const registeredPlugins = plugins.byType<PbButtonElementClickHandlerPlugin>(
                  "pb-page-element-button-click-handler"
              );

              return registeredPlugins.map(plugin => {
                  return {
                      id: plugin.name!,
                      name: plugin.title,
                      handler: plugin.handler,
                      variables: plugin.variables
                  };
              });
          },
          linkComponent: ({ href, children, ...rest }) => {
              return (
                  <Link to={href!} {...rest}>
                      {children}
                  </Link>
              );
          }
      });

export default (args: PbRenderElementPluginArgs = {}) => {
    const elementType = kebabCase(args.elementType || "button");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            render
        } as PbRenderElementPlugin
    ];
};
