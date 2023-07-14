import kebabCase from "lodash/kebabCase";
import {
    PbRenderElementPluginArgs,
    PbRenderElementPlugin,
    PbButtonElementClickHandlerPlugin
} from "~/types";
import { createButton } from "@webiny/app-page-builder-elements/renderers/button";
import { plugins } from "@webiny/plugins";

import React from "react";
import { Link } from "@webiny/react-router";

export default (args: PbRenderElementPluginArgs = {}) => {
    const elementType = kebabCase(args.elementType || "button");

    return [
        {
            name: `pb-render-page-element-${elementType}`,
            type: "pb-render-page-element",
            elementType: elementType,
            render: createButton({
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
                        // While testing, we noticed that the `href` prop is sometimes `null` or `undefined`.
                        // Hence the `href || ""` part. This fixes the issue.
                        <Link to={href || ""} {...rest}>
                            {children}
                        </Link>
                    );
                }
            })
        } as PbRenderElementPlugin
    ];
};
