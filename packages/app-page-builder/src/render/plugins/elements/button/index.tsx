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

export default (args: PbRenderElementPluginArgs = {}) => {
    const elementType = kebabCase(args.elementType || "button");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            renderer: createButton({
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
            }),
            // @deprecation-warning pb-legacy-rendering-engine
            render(props) {
                return <Button {...props} />;
            }
        } as PbRenderElementPlugin
    ];
};
