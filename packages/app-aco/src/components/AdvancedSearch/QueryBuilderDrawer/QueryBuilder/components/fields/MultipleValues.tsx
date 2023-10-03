import React from "react";

import { Bind } from "@webiny/form";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";

import { Predefined } from "~/components/AdvancedSearch/QueryObject";

interface MultipleValuesProps {
    predefined: Predefined[];
    name: string;
}

export const MultipleValues = ({ predefined, name }: MultipleValuesProps) => {
    return (
        <Bind name={name}>
            <CheckboxGroup label="Values">
                {({ onChange, getValue }) => (
                    <>
                        {predefined.map(({ label, value }) => (
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
