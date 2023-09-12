import React, { useMemo } from "react";

import { Bind } from "@webiny/form";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { validation } from "@webiny/validation";

import { Field } from "~/components/AdvancedSearch/types";

interface MultipleValuesProps {
    field: Field;
    name: string;
}

export const MultipleValues: React.VFC<MultipleValuesProps> = ({ field, name }) => {
    const predefinedValues = useMemo(() => {
        if (!field.predefinedValues?.values) {
            return [];
        }

        return field.predefinedValues?.values.map(({ label, value }) => ({
            label,
            value
        }));
    }, [field]);

    return (
        <Bind name={name} validators={[validation.create("required")]}>
            <CheckboxGroup label="Values">
                {({ onChange, getValue }) => (
                    <>
                        {predefinedValues.map(({ label, value }) => (
                            <Checkbox
                                key={value}
                                label={label}
                                value={getValue(value)}
                                onChange={onChange(value)}
                            />
                        ))}
                    </>
                )}
            </CheckboxGroup>
        </Bind>
    );
};
