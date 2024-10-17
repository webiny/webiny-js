import React from "react";
import { plugins } from "@webiny/plugins";
import { ButtonRenderer } from "@webiny/app-page-builder-elements/renderers/button";
import { PbButtonElementClickHandlerPlugin } from "~/types";

export const AddButtonClickHandlers = ButtonRenderer.createDecorator(Original => {
    return function ButtonWithClickHandlers(props) {
        const registeredPlugins = plugins.byType<PbButtonElementClickHandlerPlugin>(
            "pb-page-element-button-click-handler"
        );

        const clickHandlers = registeredPlugins.reduce((acc, plugin) => {
            return [
                ...acc,
                {
                    id: plugin.name!,
                    name: plugin.title,
                    handler: plugin.handler,
                    variables: plugin.variables
                }
            ];
        }, props.clickHandlers || []);

        return <Original {...props} clickHandlers={clickHandlers} />;
    };
});
