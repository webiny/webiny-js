import React from "react";
import { PbButtonElementClickHandlerPlugin } from "~/types";
import { createButton } from "@webiny/app-page-builder-elements/renderers/button";
import { plugins } from "@webiny/plugins";

const PeButton = createButton({
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

export default PeButton;
