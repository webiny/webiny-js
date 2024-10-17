import React from "react";
import { ParagraphRenderer } from "@webiny/app-page-builder-elements/renderers/paragraph";
import { useElementVariables } from "~/hooks/useElementVariables";
import { PbBlockVariable } from "~/types";

const getVariableValues = (variables: PbBlockVariable<string>[]) => {
    return {
        text: variables[0]?.value || undefined
    };
};

export const ParagraphRendererWithVariables = ParagraphRenderer.createDecorator(Original => {
    return function ParagraphRenderer(props) {
        const variables = useElementVariables(props.element);

        if (!variables.length) {
            return <Original {...props} />;
        }

        const variableValues = getVariableValues(variables);

        return (
            <Original
                {...props}
                inputs={{
                    text: props.inputs?.text ?? variableValues.text
                }}
            />
        );
    };
});
