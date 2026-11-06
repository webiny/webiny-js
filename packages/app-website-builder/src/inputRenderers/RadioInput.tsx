import React from "react";
import { RadioGroup } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import type { RadioInput, RadioOption } from "@webiny/website-builder-sdk";
import {
    getRadioOptionNodes,
    getSelectedRadioValue,
    hasRadioOptionInputs,
    withRadioValue
} from "@webiny/website-builder-sdk";
import { InputField } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/InputField.js";

const toItems = (options: RadioOption[]) => {
    return options.map(option => ({
        value: option.value,
        label: option.label ?? option.value
    }));
};

/**
 * A radio whose options carry inputs: the radio writes the `value` child, and the selected option's
 * inputs are drawn below it with that option's definitions (labels, validation).
 */
const RadioWithOptionInputs = ({
    label,
    value,
    onChange,
    node,
    element,
    bindings,
    input
}: ElementInputRendererProps & {
    node: NonNullable<ElementInputRendererProps["node"]>;
}) => {
    const radio = input as RadioInput;
    // `value` is the radio object resolved for the active breakpoint, so an override of the selection shows.
    const selected = getSelectedRadioValue(node, value);
    const optionNodes = getRadioOptionNodes(node, selected);

    return (
        <div className={"flex flex-col gap-md"}>
            <RadioGroup
                value={selected}
                onChange={next => {
                    if (next === selected) {
                        return;
                    }
                    onChange(({ value }) => {
                        value.set(withRadioValue(value.get(), next));
                    });
                }}
                items={toItems(radio.options)}
                label={label}
                description={radio.description}
                note={radio.helperText}
            />
            {element
                ? optionNodes.map(child => (
                      <InputField
                          key={child.path}
                          element={element}
                          node={child}
                          bindings={bindings}
                      />
                  ))
                : null}
        </div>
    );
};

export const RadioInputRenderer = (props: ElementInputRendererProps) => {
    const { value, onChange, label, node } = props;
    if (node && hasRadioOptionInputs(node)) {
        return <RadioWithOptionInputs {...props} node={node} />;
    }

    const input = props.input as RadioInput;
    return (
        <RadioGroup
            value={value}
            onChange={newValue => {
                onChange(({ value }) => {
                    value.set(newValue);
                });
            }}
            items={toItems(input.options)}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
