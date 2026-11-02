import React from "react";

import { Bind } from "@webiny/form";
import { SwitchPrimitive } from "@webiny/admin-ui";
import { Operation } from "~/components/AdvancedSearch/domain/index.js";

interface OperationSelectorProps {
    label: string;
    name: string;
}

export const OperationSelector = ({ label, name }: OperationSelectorProps) => {
    const getValue = (value: Operation): boolean => {
        return value === Operation.AND;
    };

    const setValue = (value: boolean): Operation => {
        if (value) {
            return Operation.AND;
        } else {
            return Operation.OR;
        }
    };

    return (
        <Bind name={name}>
            {({ value, onChange }) => (
                // The primitive keeps the label inline: both call sites put this switch in a
                // header row, next to a title, not in a form with a label above it.
                <SwitchPrimitive
                    label={label}
                    checked={getValue(value)}
                    onChange={value => onChange(setValue(value))}
                />
            )}
        </Bind>
    );
};
