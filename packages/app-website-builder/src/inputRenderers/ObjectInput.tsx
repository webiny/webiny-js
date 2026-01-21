import React from "react";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import { ActiveElement } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/ActiveElement.js";
import { InputField } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/InputField.js";
import { FieldArray } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/FieldArray.js";

export const ObjectInputRenderer = ({
    input,
    onChange,
    label,
    astNode
}: ElementInputRendererProps) => {
    if (astNode.list) {
        return (
            <ActiveElement>
                {element => <FieldArray node={astNode} element={element} onChange={onChange} />}
            </ActiveElement>
        );
    }

    return (
        <fieldset>
            <legend>{input.label}</legend>
            <ActiveElement>
                {element => {
                    return astNode.children.map(child => (
                        <InputField key={child.path} element={element} node={child} />
                    ));
                }}
            </ActiveElement>
        </fieldset>
    );
};
