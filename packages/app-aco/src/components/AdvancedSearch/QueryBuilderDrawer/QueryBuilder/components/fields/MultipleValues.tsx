import React from "react";

import { Bind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";

import { Predefined } from "~/components/AdvancedSearch/domain";

interface MultipleValuesProps {
    predefined: Predefined[];
    name: string;
}

export const MultipleValues = ({ predefined, name }: MultipleValuesProps) => {
    return (
        <Bind name={name}>
            {({ value, onChange, validation }) => (
                <Select
                    label={"Values"}
                    options={predefined.map(field => ({
                        label: field.label,
                        value: field.value
                    }))}
                    value={value}
                    onChange={data => onChange(data)}
                    validation={validation}
                />
            )}
        </Bind>
    );
};
