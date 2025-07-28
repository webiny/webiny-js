import React from "react";
import { Select } from "@webiny/admin-ui";

import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument";
import { StatePathsExtractor } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/StatePathsExtractor";
import { ComponentInput, DocumentElement } from "@webiny/website-builder-sdk";

interface ExpressionRendererProps {
    element: DocumentElement;
    input: ComponentInput;
    value: string;
    onChange: (value: string) => void;
}

export const ExpressionRenderer = ({
    element,
    input,
    value,
    onChange
}: ExpressionRendererProps) => {
    const options = useSelectFromDocument(document => {
        const repeat = document.bindings[element.id]?.$repeat;

        if (repeat) {
            return (
                new StatePathsExtractor(document.state)
                    .getChildPaths(repeat.expression)
                    // TODO: implement data type adapters
                    // .filter(option => option.type.matches(input.dataType))
                    .values()
            );
        }
        return (
            new StatePathsExtractor(document.state)
                .getPaths()
                // TODO: implement data type adapters
                // .filter(option => option.type.matches(input.dataType))
                .values()
        );
    });

    return (
        <Select
            label={input.label}
            placeholder={"Select binding"}
            options={options}
            value={value}
            onChange={value => onChange(value === "" ? undefined : value)}
        />
    );
};
