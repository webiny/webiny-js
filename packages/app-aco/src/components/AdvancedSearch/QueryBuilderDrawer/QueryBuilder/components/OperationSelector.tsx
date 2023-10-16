import React from "react";

import { Bind } from "@webiny/form";
import { Switch } from "@webiny/ui/Switch";
import { Operation } from "~/components/AdvancedSearch/domain";

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
                <Switch
                    label={label}
                    value={getValue(value)}
                    onChange={value => onChange(setValue(value))}
                />
            )}
        </Bind>
    );
};
