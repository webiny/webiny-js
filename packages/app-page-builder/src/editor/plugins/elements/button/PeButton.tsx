import React from "react";
import { PbButtonElementClickHandlerPlugin } from "~/types";
import {
    createButton,
    getValueFromElement
} from "@webiny/app-page-builder-elements/renderers/button";
import { plugins } from "@webiny/plugins";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { Element } from "@webiny/app-page-builder-elements/types";
import { TranslationItem } from "~/translations";
import { usePage } from "~/pageEditor";

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
    const [page] = usePage();
    const variableValue = useElementVariableValue(element);

    if (variableValue) {
        return (
            <>
                <TranslationItem
                    collection={`page:${page.id}`}
                    itemId={element.id}
                    source={variableValue?.label}
                    context={{ type: "button-with-variable" }}
                />
                <Button
                    {...props}
                    buttonText={variableValue?.label}
                    action={{ actionType: "link", newTab: false, href: variableValue.url }}
                />
            </>
        );
    }

    return (
        <>
            <TranslationItem
                collection={`page:${page.id}`}
                itemId={element.id}
                source={getValueFromElement(element)}
                context={{ type: "raw-button" }}
            />
            <Button
                {...props}
                inputs={{
                    buttonText: { source: "custom", value: "Injected Label!" },
                    iconColor: { source: "block", value: "red" }
                }}
            />
        </>
    );
};

export default PeButton;
