import React from "react";
import { PbButtonElementClickHandlerPlugin } from "~/types";
import { createButton } from "@webiny/app-page-builder-elements/renderers/button";
import { plugins } from "@webiny/plugins";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { Element } from "@webiny/app-page-builder-elements/types";

const Button = createButton({
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

interface Props {
    element: Element;
}

const PeButton = (props: Props) => {
    const { element } = props;
    const variableValue = useElementVariableValue(element);
    if (variableValue) {
        return (
            <Button
                {...props}
                buttonText={variableValue?.label}
                action={{ actionType: "link", newTab: false, href: variableValue.url }}
            />
        );
    }

    return <Button {...props} />;
};

export default PeButton;
