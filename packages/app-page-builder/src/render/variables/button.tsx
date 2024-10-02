import React from "react";
import { ButtonRenderer } from "@webiny/app-page-builder-elements/renderers/button";
import { useElementVariables } from "~/hooks/useElementVariables";
import { PbBlockVariable } from "~/types";

const getVariableValues = (variables: PbBlockVariable<string>[]) => {
    return {
        label: variables.find(variable => variable.id.endsWith(".label"))?.value || undefined,
        url: variables.find(variable => variable.id.endsWith(".url"))?.value || undefined
    };
};

export const ButtonRendererWithVariables = ButtonRenderer.createDecorator(Original => {
    return function ButtonRenderer(props) {
        const variables = useElementVariables(props.element);

        if (!variables.length) {
            return <Original {...props} />;
        }

        const variableValues = getVariableValues(variables);

        return (
            <Original
                {...props}
                inputs={{
                    buttonText: props.inputs?.buttonText ?? variableValues.label,
                    actionHref: props.inputs?.actionHref ?? variableValues.url
                }}
            />
        );
    };
});
