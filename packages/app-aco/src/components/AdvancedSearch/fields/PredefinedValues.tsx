import React from "react";

import { Bind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { useInputField } from "~/components";

export const PredefinedValues = () => {
    const { name, field } = useInputField();

    return (
        <Bind name={name}>
            {({ value, onChange, validation }) => (
                <Select
                    label={"Values"}
                    options={field.predefined.map(field => ({
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
