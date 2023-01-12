import React from "react";
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

// @ts-ignore Resolve once we deprecate legacy rendering engine.
let render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? Button
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
